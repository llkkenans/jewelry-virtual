CREATE OR REPLACE FUNCTION public.deduct_credit()
RETURNS TRIGGER AS $$
DECLARE
  current_credits integer;
BEGIN
  SELECT credits INTO current_credits
  FROM public.profiles
  WHERE id = NEW.user_id
  FOR UPDATE;

  IF current_credits < NEW.credits_used THEN
    RAISE EXCEPTION 'insufficient_credits'
      USING ERRCODE = 'P0001';
  END IF;

  UPDATE public.profiles
  SET credits = GREATEST(0, credits - NEW.credits_used)
  WHERE id = NEW.user_id;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
