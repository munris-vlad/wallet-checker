<template>
    <div class="flex items-center justify-center p-4">
        <div class="w-full max-w-md p-2 space-y-6 rounded">
            <h2 class="text-2xl font-bold text-center">Login</h2>
            <form @submit.prevent="handleLogin" class="space-y-4">
                <div>
                    <label class="block mb-2 text-sm font-medium">Username</label>
                    <input v-model="username" type="text"
                        class="w-full px-3 py-2 border rounded-md focus:outline-none bg-gray-600 border-gray-500 focus:ring-2 focus:ring-violet-600" />
                </div>
                <div>
                    <label class="block mb-2 text-sm font-medium">Password</label>
                    <input v-model="password" type="password"
                        class="w-full px-3 py-2 border rounded-md focus:outline-none bg-gray-600 border-gray-500 focus:ring-2 focus:ring-violet-600" />
                </div>
                <button type="submit" class="w-full px-4 py-2 text-white bg-violet-600 rounded-md hover:bg-violet-700">
                    Login
                </button>
                <p v-if="error" class="text-red-600">{{ error }}</p>
            </form>
        </div>
    </div>
</template>

<script>
export default {
    data() {
        return {
            username: "",
            password: "",
            error: ""
        }
    },
    methods: {
        handleLogin() {
            fetch("/api/login", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ username: this.username, password: this.password }),
                credentials: "include"
            })
                .then(response => {
                    if (!response.ok) throw new Error("Login failed")
                    return response.json()
                })
                .then(() => {
                    localStorage.setItem('isAuthenticated', true)
                    this.$router.push({ name: "Home" })
                })
                .catch(error => {
                    this.error = error.message
                })
        }
    }
};

</script>

<style scoped></style>