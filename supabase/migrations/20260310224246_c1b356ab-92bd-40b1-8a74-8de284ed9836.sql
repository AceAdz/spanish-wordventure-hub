
-- Custom word sets table
CREATE TABLE public.custom_word_sets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  class_id uuid REFERENCES public.classes(id) ON DELETE CASCADE NOT NULL,
  name text NOT NULL,
  word_type text NOT NULL DEFAULT 'vocabulary',
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.custom_word_sets ENABLE ROW LEVEL SECURITY;

-- Teacher (owner of class) can do everything
CREATE POLICY "Teachers can manage word sets" ON public.custom_word_sets
  FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.classes WHERE classes.id = custom_word_sets.class_id AND classes.teacher_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM public.classes WHERE classes.id = custom_word_sets.class_id AND classes.teacher_id = auth.uid()));

-- Class members can view word sets
CREATE POLICY "Class members can view word sets" ON public.custom_word_sets
  FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.class_members WHERE class_members.class_id = custom_word_sets.class_id AND class_members.user_id = auth.uid()));

-- Custom words table
CREATE TABLE public.custom_words (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  word_set_id uuid REFERENCES public.custom_word_sets(id) ON DELETE CASCADE NOT NULL,
  spanish text NOT NULL,
  english text NOT NULL,
  verb_infinitive text,
  tense text,
  conjugated_form text,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.custom_words ENABLE ROW LEVEL SECURITY;

-- Teachers can manage words in their class word sets
CREATE POLICY "Teachers can manage words" ON public.custom_words
  FOR ALL TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.custom_word_sets ws
    JOIN public.classes c ON c.id = ws.class_id
    WHERE ws.id = custom_words.word_set_id AND c.teacher_id = auth.uid()
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.custom_word_sets ws
    JOIN public.classes c ON c.id = ws.class_id
    WHERE ws.id = custom_words.word_set_id AND c.teacher_id = auth.uid()
  ));

-- Class members can view words
CREATE POLICY "Class members can view words" ON public.custom_words
  FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.custom_word_sets ws
    JOIN public.class_members cm ON cm.class_id = ws.class_id
    WHERE ws.id = custom_words.word_set_id AND cm.user_id = auth.uid()
  ));
