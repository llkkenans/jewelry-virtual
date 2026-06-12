import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { supabaseAdmin } from '@/lib/supabase/server'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-05-28.basil',
})

export async function POST(req: NextRequest) {
  const body = await req.text()
  const sig  = req.headers.get('stripe-signature')

  if (!sig) {
    return NextResponse.json({ error: 'İmza eksik' }, { status: 400 })
  }

  let event: Stripe.Event
  try {
    event = stripe.webhooks.constructEvent(
      body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET!
    )
  } catch (err) {
    console.error('Webhook imza hatası:', err)
    return NextResponse.json({ error: 'Geçersiz imza' }, { status: 400 })
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as Stripe.Checkout.Session

    const userId  = session.metadata?.supabase_user_id
    const credits = Number(session.metadata?.credits)

    if (!userId || !credits) {
      console.error('Metadata eksik:', session.metadata)
      return NextResponse.json({ error: 'Metadata eksik' }, { status: 400 })
    }

    const { error } = await supabaseAdmin.rpc('add_credits', {
      p_user_id: userId,
      p_amount:  credits,
    })

    if (error) {
      console.error('Kredi ekleme hatası:', error)
      return NextResponse.json({ error: 'Kredi eklenemedi' }, { status: 500 })
    }

    console.log(`Kredi eklendi: ${credits} → user ${userId}`)
  }

  return NextResponse.json({ received: true })
}
