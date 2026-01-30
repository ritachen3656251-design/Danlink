-- 将 messages.receiver_id 修正为接收方的 profile UUID（与 profiles.id 一致）
-- 规则：同一会话中，发送方 sender_id 为一方，接收方 receiver_id 为另一方（conversations 的 publisher_id / acceptor_id）

UPDATE public.messages m
SET receiver_id = CASE
  WHEN m.sender_id = c.publisher_id THEN c.acceptor_id
  WHEN m.sender_id = c.acceptor_id THEN c.publisher_id
  ELSE m.receiver_id
END
FROM public.conversations c
WHERE m.conversation_id = c.id
  AND c.publisher_id IS NOT NULL
  AND c.acceptor_id IS NOT NULL
  AND m.sender_id IN (c.publisher_id, c.acceptor_id)
  AND (
    m.receiver_id IS NULL
    OR m.receiver_id <> CASE
      WHEN m.sender_id = c.publisher_id THEN c.acceptor_id
      WHEN m.sender_id = c.acceptor_id THEN c.publisher_id
    END
  );
