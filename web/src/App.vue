<template>
    <div class="container w-full max-w-none px-48">
        <header class="p-3 text-center border-b dark:border-neutral-500" v-if="isAuthenticated">
            <nav class="flex justify-center items-center space-x-3">
                <router-link class="flex items-center text-gray-500 hover:text-gray-600 px-2" to="/"><img class="rounded-full w-6 h-6 mr-2" :src="'/munrisik.png'" alt=""> Home</router-link>
                <router-link v-if="appconfig.modules.story.enabled" class="flex items-center text-gray-500 hover:text-gray-600 px-2" to="/story"><img class="rounded-full w-6 h-6 mr-2" :src="'/story.svg'" alt=""> Story</router-link>
                <router-link v-if="appconfig.modules.eclipse.enabled" class="flex items-center text-gray-500 hover:text-gray-600 px-2" to="/eclipse"><img class="rounded-full w-6 h-6 mr-2" :src="'/eclipse-scan.png'" alt=""> Eclipse</router-link>
                <router-link v-if="appconfig.modules.zksync.enabled" class="flex items-center text-gray-500 hover:text-gray-600 px-2" to="/zksync"><img class="rounded-full w-6 h-6 mr-2" :src="'/zksync-scan.png'" alt=""> ZkSync</router-link>
                <router-link v-if="appconfig.modules.layerzero.enabled" class="flex items-center text-gray-500 hover:text-gray-600 px-2" to="/layerzero"><img class="rounded-full w-6 h-6 mr-2" :src="'/layerzero.png'" alt=""> Layerzero</router-link>
                <router-link v-if="appconfig.modules.jumper.enabled" class="flex items-center text-gray-500 hover:text-gray-600 px-2" to="/jumper"><img class="rounded-full w-6 h-6 mr-2" :src="'/jumper.svg'" alt=""> Jumper</router-link>
                <router-link v-if="appconfig.modules.wormhole.enabled" class="flex items-center text-gray-500 hover:text-gray-600 px-2" to="/wormhole"><img class="rounded-full w-6 h-6 mr-2" :src="'/wormhole.jpg'" alt=""> Wormhole</router-link>
                <router-link v-if="appconfig.modules.zkbridge.enabled" class="flex items-center text-gray-500 hover:text-gray-600 px-2" to="/zkbridge"><img class="rounded-full w-6 h-6 mr-2" :src="'/zkbridge.png'" alt=""> ZkBridge</router-link>
                <router-link v-if="appconfig.modules.hyperlane.enabled" class="flex items-center text-gray-500 hover:text-gray-600 px-2" to="/hyperlane"><img class="rounded-full w-6 h-6 mr-2" :src="'/hyperlane.png'" alt=""> Hyperlane</router-link>
                <router-link v-if="appconfig.modules.debridge.enabled" class="flex items-center text-gray-500 hover:text-gray-600 px-2" to="/debridge"><img class="rounded-full w-6 h-6 mr-2" :src="'/debridge.png'" alt=""> Debridge</router-link>
                <router-link v-if="appconfig.modules.zora.enabled" class="flex items-center text-gray-500 hover:text-gray-600 px-2" to="/zora"><img class="rounded-full w-6 h-6 mr-2" :src="'/zora-scan.png'" alt=""> Zora</router-link>
                <router-link v-if="appconfig.modules.base.enabled" class="flex items-center text-gray-500 hover:text-gray-600 px-2" to="/base"><img class="rounded-full w-6 h-6 mr-2" :src="'/base.png'" alt=""> Base</router-link>
                <router-link v-if="appconfig.modules.aptos.enabled" class="flex items-center text-gray-500 hover:text-gray-600 px-2" to="/aptos"><img class="rounded-full w-6 h-6 mr-2" :src="'/aptos.png'" alt=""> Aptos</router-link>
                <router-link v-if="appconfig.modules.linea.enabled" class="flex items-center text-gray-500 hover:text-gray-600 px-2" to="/linea"><img class="rounded-full w-6 h-6 mr-2" :src="'/linea-scan.png'" alt=""> Linea</router-link>
                <router-link v-if="appconfig.modules.scroll.enabled" class="flex items-center text-gray-500 hover:text-gray-600 px-2" to="/scroll"><img class="rounded-full w-6 h-6 mr-2" :src="'/scroll-scan.png'" alt=""> Scroll</router-link>
                <router-link v-if="appconfig.modules.polygonzkevm.enabled" class="flex items-center text-gray-500 hover:text-gray-600 px-2" to="/polygonzkevm"><img class="rounded-full w-6 h-6 mr-2" :src="'/polygon-scan.png'" alt=""> Polygon ZKEVM</router-link>
                <router-link v-if="appconfig.modules.balance.enabled" class="flex items-center text-gray-500 hover:text-gray-600 px-2" to="/balances"><img class="rounded-full w-6 h-6 mr-2" :src="'/coin.png'" alt=""> Balance</router-link>
                <router-link v-if="appconfig.modules.evm.enabled" class="flex items-center text-gray-500 hover:text-gray-600 px-2" to="/evm"><img class="rounded-full w-6 h-6 mr-2" :src="'/eth.png'" alt=""> EVM</router-link>
                <router-link v-if="appconfig.modules.clusters.enabled" class="flex items-center text-gray-500 hover:text-gray-600 px-2" to="/clusters"><img class="rounded-full w-6 h-6 mr-2" :src="'/clusters.jfif'" alt=""> Clusters</router-link>
                <router-link v-if="appconfig.modules.rabby.enabled" class="flex items-center text-gray-500 hover:text-gray-600 px-2" to="/rabby"><img class="rounded-full w-6 h-6 mr-2" :src="'/rabby.png'" alt=""> Rabby</router-link>
                <router-link v-if="appconfig.modules.nft.enabled" class="flex items-center text-gray-500 hover:text-gray-600 px-2" to="/nft"><img class="rounded-full w-6 h-6 mr-2" :src="'/nft.png'" alt=""> NFT</router-link>
                <router-link v-if="appconfig.modules.galxe.enabled" class="flex items-center text-gray-500 hover:text-gray-600 px-2" to="/galxe"><img class="rounded-full w-6 h-6 mr-2" :src="'/galxe.png'" alt=""> Galxe</router-link>
            </nav>
        </header>

        <header class="p-3 text-center border-b dark:border-neutral-500" v-if="!isAuthenticated">
            <nav class="flex justify-center items-center space-x-3 text-gray-500 hover:text-gray-600">Wallet checker by <img class="rounded-full w-6 h-6 ml-2" :src="'/munrisik.png'" alt=""> <a href="https://t.me/by_munris" target="_blank" class="text-gray-500 hover:text-gray-600">Munris</a></nav>
        </header>
        <router-view/>
    </div>
</template>

<script>

export default {
    data() {
        return {
            appconfig: this.$appconfig,
            isAuthenticated: JSON.parse(localStorage.getItem('isAuthenticated')) || false
        }
    },
    mounted() {
        this.fetchAuth()
        this.intervalId = setInterval(this.fetchAuth, 1000)
    },
    methods: {
        fetchAuth() {
            this.isAuthenticated = JSON.parse(localStorage.getItem('isAuthenticated')) || false
        }
    }
}
</script>

<style>

nav {
  padding: 30px;
}

nav a {
  font-weight: bold;
  color: #2c3e50;
}

nav a.router-link-exact-active {
  color: #42b983;
}
</style>
