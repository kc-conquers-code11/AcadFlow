import { sendPassword } from "@/emails/sendUserNamePassword";
import { supabase } from "@/lib/supabase";
import { IStaff } from "@/types/admin";

// Staff
const addStaff = async ({ email, name, subjectId }) => {
    try {
        /*
        1. check is exist then return 
        2. add in auth.user with signup
        3. send email
        4. add in profiles with
        5. verify,check and return msg as per task done or error
        */

        const { data: existingUser, error: checkError } = await supabase
            .from("profiles")
            .select("id")
            .eq("email", email)
            .single()

        if (existingUser) {
            return {
                success: false,
                message: "Staff already exists"
            }
        }

        if (checkError && checkError.code !== "PGRST116") {
            throw checkError
        }
        const password = crypto.randomUUID()

        const { data: signUpData, error: signUpError } =
            await supabase.auth.signUp({
                email,
                password
            })

        if (signUpError) throw signUpError

        const user = signUpData.user
        if (!user) throw new Error("User creation failed")



        const { error: profileError } = await supabase
            .from("profiles")
            .insert({
                id: user.id,
                email,
                name,
                role: "teacher",
            })

        if (profileError) throw profileError

        const { error: teacherError } = await supabase
            .from("teachers")
            .insert({
                id: user.id,
                email,
                name,
                subjectId,
            })

        if (teacherError) throw teacherError

        // email notification for email and password
        await sendPassword({
            to: email,
            subject: "Welcome to ACADFLOW",
            role: "teacher",
            password
        })


        return {
            success: true,
            message: "Staff added. Verification email sent."
        }


    } catch (error) {
        console.log("supabase:admin:adminServices.addStaff: ", error)

        return {
            success: false,
            message: error.message || "Failed to add staff"
        }
    }
}

const addStaffs = async (staffArray: IStaff[]) => {
    const results = []

    for (const staff of staffArray) {
        const { email, name, division, batch, subjectIds } = staff

        try {
            const { data: existingUser, error: checkError } = await supabase
                .from("profiles")
                .select("id")
                .eq("email", email)
                .single()

            if (existingUser) {
                results.push({
                    email,
                    success: false,
                    message: "Staff already exists"
                })
                continue
            }

            if (checkError && checkError.code !== "PGRST116") {
                throw checkError
            }

            const tempPassword = crypto.randomUUID()

            const { data: signUpData, error: signUpError } =
                await supabase.auth.signUp({
                    email,
                    password: tempPassword
                })

            if (signUpError) throw signUpError

            const user = signUpData.user
            if (!user) throw new Error("User creation failed")

            const { error: profileError } = await supabase
                .from("profiles")
                .insert({
                    id: user.id,
                    email,
                    name,
                    division,
                    batch,
                    role: "teacher"
                })

            if (profileError) throw profileError

            const { error: teacherError } = await supabase
                .from("teachers")
                .insert({
                    id: user.id,
                    email,
                    name,
                    subjectIds,
                })

            if (teacherError) throw teacherError

            results.push({
                email,
                success: true,
                message: "Staff added successfully"
            })

        } catch (error: any) {
            console.log(`addStaffs error for ${email}:`, error)

            results.push({
                email,
                success: false,
                message: error.message || "Failed to add staff"
            })
        }
    }

    const successCount = results.filter(r => r.success).length

    return {
        total: staffArray.length,
        success: successCount,
        failed: staffArray.length - successCount,
        results
    }
}


const deleteStaff = async ({ id }) => {
    try {
        const { data: profiles, error: profileError } = await supabase.from("profiles").delete().eq("id", id)
        if (profileError) {

            throw profileError
        }
    } catch (error) {

    }
}


const editStaff = async ({ id }) => {

}


const getStaffs = async () => {
    try {
        const { data: teachers, error: teacherError } = await supabase
            .from("teachers")
            .select(`
        userid,
        subject_ids,
        profiles (
          name,
          email
        )
      `);

        if (teacherError) throw teacherError;

        const { data: subjects, error: subjectError } = await supabase
            .from("subjects")
            .select("subject_id, name");

        if (subjectError) throw subjectError;

        const staffs = teachers.map((teacher: any) => {
            const teacherSubjects =
                teacher.subject_ids?.map((sid: string) =>
                    subjects.find(sub => sub.subject_id === sid)
                ).filter(Boolean) || [];

            return {
                name: teacher.profiles?.name ?? null,
                email: teacher.profiles?.email ?? null,
                subjects: teacherSubjects.map(sub => ({
                    name: sub!.name
                }))
            };
        });

        return {
            success: true,
            data: staffs
        };

    } catch (error: any) {
        console.error("supabase:admin:getStaffs:", error);

        return {
            success: false,
            message: error.message || "Failed to fetch staffs"
        };
    }
};


// Student

const addStudent = async () => {
    try {

    } catch (error) {

    }
}

const addStudents = async () => { }

// mapping

const bulkMappint = async () => { }

const mapping = async () => { }


export { addStaff, addStaffs, deleteStaff, editStaff, getStaffs }