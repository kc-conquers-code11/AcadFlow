import { useState } from "react";
import { supabase } from "../supabaseClient";

export default function ForgotPassword() {
    const [email, setEmail] = useState("");
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState("");

    const handleReset = async (e) => {
        e.preventDefault();
        setLoading(true);

        const { error } = await supabase.auth.resetPasswordForEmail(email, {
            redirectTo: "http://localhost:8080/reset-password",
        });

        if (error) {
            setMessage(error.message);
        } else {
            setMessage("Password reset link sent to your email");
        }

        setLoading(false);
    };

    return (
        <form onSubmit={handleReset}>
            <h2>Forgot Password</h2>

            <input
                type="email"
                placeholder="Enter your email"
                value={email}
                required
                onChange={(e) => setEmail(e.target.value)}
            />

            <button disabled={loading}>
                {loading ? "Sending..." : "Send Reset Link"}
            </button>

            {message && <p>{message}</p>}
        </form>
    );
}
