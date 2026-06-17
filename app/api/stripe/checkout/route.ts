import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { supabaseAdmin } from '@/lib/supabase/server'

const PLANS = {
  starter: { credits: 50,  price: 900,  name: 'Starter — 50 Kredi'  },
  growth:  { credits: 150, price: 2400, name: 'Growth — 150 Kredi'  },
  pro:     { credits: 400, price: 4900, name: 'Pro — 400 Kredi'     },
} as const

type PlanId = keyof typeof PLANS

export async function POST(req: NextRequest) {
  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY ?? '', {
    apiVersion: '2026-05-27.dahlia',
  })

  const token = req.headers.get('authorization')?.replace('Bearer ', '')
  if (!token) {
    return NextResponse.json({ error: 'Yetkisiz' }, { status: 401 })
  }

  const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token)
  if (authError || !user) {
    return NextResponse.json({ error: 'Yetkisiz' }, { status: 401 })
  }

  let planId: PlanId
  try {
    const body = await req.json()
    planId = body.planId as PlanId
  } catch {
    return NextResponse.json({ error: 'Geçersiz JSON' }, { status: 400 })
  }

  if (!planId || !PLANS[planId]) {
    return NextResponse.json(
      { error: 'Geçersiz plan. Geçerli değerler: starter, growth, pro' },
      { status: 400 }
    )
  }

  const plan = PLANS[planId]

  const { data: profile } = await supabaseAdmin
    .from('profiles')
    .select('stripe_customer_id, email')
    .eq('id', user.id)
    .single()

  let customerId = profile?.stripe_customer_id

  if (!customerId) {
    const customer = await stripe.customers.create({
      email: profile?.email || user.email,
      metadata: { supabase_user_id: user.id },
    })
    customerId = customer.id

    await supabaseAdmin
      .from('profiles')
      .update({ stripe_customer_id: customerId })
      .eq('id', user.id)
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://jewelry-virtual.vercel.app'

  const session = await stripe.checkout.sessions.create({
    customer: customerId,
    payment_method_types: ['card'],
    line_items: [{
      price_data: {
        currency: 'usd',
        product_data: {
          name: plan.name,
          description: `${plan.credits} üretim kredisi`,
        },
        unit_amount: plan.price,
      },
      quantity: 1,
    }],
    mode: 'payment',
    success_url: `${appUrl}/dashboard/billing?success=true`,
    cancel_url:  `${appUrl}/dashboard/billing?cancelled=true`,
    metadata: {
      supabase_user_id: user.id,
      plan_id:          planId,
      credits:          String(plan.credits),
    },
  })

  return NextResponse.json({ url: session.url })
}
