-- RPC FUNCTIONS FOR SAFE CLASS OPERATIONS
-- Jalankan di Supabase SQL Editor untuk membuat functions yang aman

-- 1. FUNCTION UNTUK INSERT CLASS
CREATE OR REPLACE FUNCTION insert_class_safe(class_data JSONB)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    result_record RECORD;
    user_role TEXT;
BEGIN
    -- Check if user is admin
    SELECT role INTO user_role
    FROM profiles
    WHERE id = auth.uid();

    IF user_role != 'admin' THEN
        RAISE EXCEPTION 'Only admins can create classes';
    END IF;

    -- Insert the class
    INSERT INTO classes (
        name,
        education_level,
        grade_level,
        teacher_id,
        schedule,
        room_number,
        academic_year,
        is_active
    )
    VALUES (
        class_data->>'name',
        class_data->>'education_level',
        (class_data->>'grade_level')::INTEGER,
        CASE WHEN class_data->>'teacher_id' != '' THEN (class_data->>'teacher_id')::UUID ELSE NULL END,
        class_data->>'schedule',
        class_data->>'room_number',
        class_data->>'academic_year',
        COALESCE((class_data->>'is_active')::BOOLEAN, true)
    )
    RETURNING * INTO result_record;

    RETURN row_to_json(result_record);
END;
$$;

-- 2. FUNCTION UNTUK UPDATE CLASS
CREATE OR REPLACE FUNCTION update_class_safe(class_id UUID, class_data JSONB)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    result_record RECORD;
    user_role TEXT;
BEGIN
    -- Check if user is admin
    SELECT role INTO user_role
    FROM profiles
    WHERE id = auth.uid();

    IF user_role != 'admin' THEN
        RAISE EXCEPTION 'Only admins can update classes';
    END IF;

    -- Update the class
    UPDATE classes
    SET
        name = class_data->>'name',
        education_level = class_data->>'education_level',
        grade_level = (class_data->>'grade_level')::INTEGER,
        teacher_id = CASE WHEN class_data->>'teacher_id' != '' THEN (class_data->>'teacher_id')::UUID ELSE NULL END,
        schedule = class_data->>'schedule',
        room_number = class_data->>'room_number',
        academic_year = class_data->>'academic_year',
        is_active = COALESCE((class_data->>'is_active')::BOOLEAN, true),
        updated_at = NOW()
    WHERE id = class_id
    RETURNING * INTO result_record;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Class not found';
    END IF;

    RETURN row_to_json(result_record);
END;
$$;

-- 3. FUNCTION UNTUK DELETE CLASS
CREATE OR REPLACE FUNCTION delete_class_safe(class_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    user_role TEXT;
BEGIN
    -- Check if user is admin
    SELECT role INTO user_role
    FROM profiles
    WHERE id = auth.uid();

    IF user_role != 'admin' THEN
        RAISE EXCEPTION 'Only admins can delete classes';
    END IF;

    -- Delete the class
    DELETE FROM classes WHERE id = class_id;

    RETURN TRUE;
END;
$$;

-- 4. GRANT EXECUTE PERMISSIONS
GRANT EXECUTE ON FUNCTION insert_class_safe(JSONB) TO authenticated;
GRANT EXECUTE ON FUNCTION update_class_safe(UUID, JSONB) TO authenticated;
GRANT EXECUTE ON FUNCTION delete_class_safe(UUID) TO authenticated;

-- 5. TEST FUNCTIONS (uncomment untuk testing)
-- SELECT insert_class_safe('{"name": "Test Class", "education_level": "sd", "grade_level": 1}'::jsonb);
-- SELECT update_class_safe('class-uuid-here'::uuid, '{"name": "Updated Class"}'::jsonb);
-- SELECT delete_class_safe('class-uuid-here'::uuid);