-- Add high-impact indexes to speed lists and user actions (safe to re-run)
-- Products: listing by status/category with keyset (created_at DESC, id DESC)
CREATE INDEX IF NOT EXISTS idx_products_status_created_at_id_desc
  ON public.products (status, created_at DESC, id DESC);

CREATE INDEX IF NOT EXISTS idx_products_category_created_at_id_desc
  ON public.products (category, created_at DESC, id DESC);

CREATE INDEX IF NOT EXISTS idx_products_user_created_at_desc
  ON public.products (user_id, created_at DESC);

-- Optional simple location filters often used in search pages
CREATE INDEX IF NOT EXISTS idx_products_city_created_at_desc
  ON public.products (city, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_products_province_created_at_desc
  ON public.products (province, created_at DESC);

-- Favorites: fast lookups by user and enforce uniqueness of favorite pair
CREATE UNIQUE INDEX IF NOT EXISTS uq_favorites_user_product
  ON public.favorites (user_id, product_id);

CREATE INDEX IF NOT EXISTS idx_favorites_user_created_at_desc
  ON public.favorites (user_id, created_at DESC);

-- Messages: cover common patterns if the table exists
DO $$
BEGIN
  IF to_regclass('public.messages') IS NOT NULL THEN
    EXECUTE 'CREATE INDEX IF NOT EXISTS idx_messages_conversation_created_at_desc ON public.messages (conversation_id, created_at DESC)';
    EXECUTE 'CREATE INDEX IF NOT EXISTS idx_messages_receiver_created_at_desc ON public.messages (receiver_id, created_at DESC)';
    EXECUTE 'CREATE INDEX IF NOT EXISTS idx_messages_sender_created_at_desc ON public.messages (sender_id, created_at DESC)';
  END IF;
END $$;

-- Conversations: optional
DO $$
BEGIN
  IF to_regclass('public.conversations') IS NOT NULL THEN
    EXECUTE 'CREATE INDEX IF NOT EXISTS idx_conversations_user_updated_at_desc ON public.conversations (user_id, updated_at DESC)';
  END IF;
END $$;
