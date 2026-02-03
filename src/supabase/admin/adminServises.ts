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

        const { data: signUpData, error: signUpError } =
            await supabase.auth.signUp({
                email,
                password: crypto.randomUUID(),
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
        const { email, name, division, batch } = staff

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


const deleteStaff = async ({ id }) => { }

// Student

const addStudent = async () => { }

const addStudents = async () => { }

// mapping

const bulkMappint = async () => { }

const mapping = async () => { }

