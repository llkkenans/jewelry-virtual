CREATE OR REPLACE FUNCTION public.add_credits(
  p_user_id uuid,
  p_amount  integer
)
RETURNS void AS $$
BEGIN
  IF p_amount <= 0 THEN
    RAISE EXCEPTION 'invalid_amount'
      USING HINT = 'p_amount must be a positive integer.',
            ERRCODE = 'P0002';
  END IF;

  UPDATE public.profiles
  SET credits = credits + p_amount
  WHERE id = p_user_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'user_not_found'
      USING HINT = 'No profile found for the given user_id.',
            ERRCODE = 'P0003';
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
