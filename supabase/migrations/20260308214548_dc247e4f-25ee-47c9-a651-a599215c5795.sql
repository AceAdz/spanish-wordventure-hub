
-- Classes table for teacher-created classrooms
CREATE TABLE public.classes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  code text NOT NULL UNIQUE,
  description text DEFAULT '',
  teacher_id uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Class members table
CREATE TABLE public.class_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  class_id uuid NOT NULL REFERENCES public.classes(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  joined_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(class_id, user_id)
);

-- Enable RLS
ALTER TABLE public.classes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.class_members ENABLE ROW LEVEL SECURITY;

-- Classes policies
CREATE POLICY "Classes viewable by members and teacher"
  ON public.classes FOR SELECT TO authenticated
  USING (
    teacher_id = auth.uid() OR
    EXISTS (SELECT 1 FROM public.class_members WHERE class_id = classes.id AND user_id = auth.uid())
  );

CREATE POLICY "Anyone can view class by code"
  ON public.classes FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "Teachers can create classes"
  ON public.classes FOR INSERT TO authenticated
  WITH CHECK (teacher_id = auth.uid());

CREATE POLICY "Teachers can update own classes"
  ON public.classes FOR UPDATE TO authenticated
  USING (teacher_id = auth.uid());

CREATE POLICY "Teachers can delete own classes"
  ON public.classes FOR DELETE TO authenticated
  USING (teacher_id = auth.uid());

-- Class members policies
CREATE POLICY "Members viewable by class members and teacher"
  ON public.class_members FOR SELECT TO authenticated
  USING (
    user_id = auth.uid() OR
    EXISTS (SELECT 1 FROM public.classes WHERE id = class_members.class_id AND teacher_id = auth.uid())
  );

CREATE POLICY "Users can join classes"
  ON public.class_members FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can leave classes"
  ON public.class_members FOR DELETE TO authenticated
  USING (
    user_id = auth.uid() OR
    EXISTS (SELECT 1 FROM public.classes WHERE id = class_members.class_id AND teacher_id = auth.uid())
  );
