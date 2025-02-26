<template>
    <div class="home" v-if="isDataLoaded">
        <div class="min-w-full header pb-4 pt-4 text-center">
            <h1 class="text-3xl pb-5">Config</h1>

            <table class="min-w-full border text-center text-sm font-light dark:border-gray-700">
                
            </table>


            <ul class="pt-5">
                <li class="pt-2"><a href="https://t.me/by_munris" class="text-green-500 hover:text-green-600" target="_blank">by Munris</a></li>
            </ul>
        </div>
    </div>
</template>

<script>

export default {
    data() {
        return {
            appconfig: this.$appconfig,
            data: [],
            isDataLoaded: false,
        }
    },
    created() {
        this.loadData()
    },
    methods: {
        loadData() {
            this.$axios.get('/api/stats').then((response) => {
                this.data = response.data
                this.isDataLoaded = true
            }).catch((error) => {
                console.error('Ошибка при загрузке данных:', error)
            })
        },
    },
}
</script>
