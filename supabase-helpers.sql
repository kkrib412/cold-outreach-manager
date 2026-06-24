-- Add helper function for incrementing sent count
CREATE OR REPLACE FUNCTION increment_sent_count(campaign_id UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE campaigns
  SET sent_count = sent_count + 1
  WHERE id = campaign_id;
END;
$$ LANGUAGE plpgsql;
