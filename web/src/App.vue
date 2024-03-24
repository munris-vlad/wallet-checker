<template>
    <div class="container mx-auto">
        <header class="p-3 text-center border-b dark:border-neutral-500">
            <nav class="flex justify-center items-center space-x-3">
                <router-link class="flex items-center text-gray-500 hover:text-gray-600 px-2" to="/"><img class="rounded-full w-6 h-6 mr-2" :src="'/munrisik.png'" alt=""> Home</router-link>
                <router-link v-if="zk_count" class="flex items-center text-gray-500 hover:text-gray-600 px-2" to="/zksync"><img class="rounded-full w-6 h-6 mr-2" :src="'/zksync-scan.png'" alt=""> ZkSync</router-link>
                <router-link v-if="layerzero_count" class="flex items-center text-gray-500 hover:text-gray-600 px-2" to="/layerzero"><img class="rounded-full w-6 h-6 mr-2" :src="'/layerzero.png'" alt=""> Layerzero</router-link>
                <router-link v-if="wormhole_count" class="flex items-center text-gray-500 hover:text-gray-600 px-2" to="/wormhole"><img class="rounded-full w-6 h-6 mr-2" :src="'/wormhole.jpg'" alt=""> Wormhole</router-link>
                <router-link v-if="zkbridge_count" class="flex items-center text-gray-500 hover:text-gray-600 px-2" to="/zkbridge"><img class="rounded-full w-6 h-6 mr-2" :src="'/zkbridge.png'" alt=""> ZkBridge</router-link>
                <router-link v-if="hyperlane_count" class="flex items-center text-gray-500 hover:text-gray-600 px-2" to="/hyperlane"><img class="rounded-full w-6 h-6 mr-2" :src="'/hyperlane.png'" alt=""> Hyperlane</router-link>
                <router-link v-if="zora_count" class="flex items-center text-gray-500 hover:text-gray-600 px-2" to="/zora"><img class="rounded-full w-6 h-6 mr-2" :src="'/zora-scan.png'" alt=""> Zora</router-link>
                <router-link v-if="base_count" class="flex items-center text-gray-500 hover:text-gray-600 px-2" to="/base"><img class="rounded-full w-6 h-6 mr-2" :src="'/base.png'" alt=""> Base</router-link>
                <router-link v-if="aptos_count" class="flex items-center text-gray-500 hover:text-gray-600 px-2" to="/aptos"><img class="rounded-full w-6 h-6 mr-2" :src="'/aptos.png'" alt=""> Aptos</router-link>
                <router-link v-if="linea_count" class="flex items-center text-gray-500 hover:text-gray-600 px-2" to="/linea"><img class="rounded-full w-6 h-6 mr-2" :src="'/linea-scan.png'" alt=""> Linea</router-link>
                <router-link v-if="scroll_count" class="flex items-center text-gray-500 hover:text-gray-600 px-2" to="/scroll"><img class="rounded-full w-6 h-6 mr-2" :src="'/scroll-scan.png'" alt=""> Scroll</router-link>
                <router-link v-if="evm_count" class="flex items-center text-gray-500 hover:text-gray-600 px-2" to="/balances"><img class="rounded-full w-6 h-6 mr-2" :src="'/coin.png'" alt=""> Balance</router-link>
                <router-link v-if="evm_count" class="flex items-center text-gray-500 hover:text-gray-600 px-2" to="/evm"><img class="rounded-full w-6 h-6 mr-2" :src="'/eth.png'" alt=""> EVM</router-link>
            </nav>
        </header>
        <router-view/>
    </div>
</template>

<script>
export default {
    data() {
        return {
            zk_count: this.$zk_count,
            layerzero_count: this.$layerzero_count,
            wormhole_count: this.$wormhole_count,
            hyperlane_count: this.$hyperlane_count,
            zkbridge_count: this.$zkbridge_count,
            zora_count: this.$zora_count,
            base_count: this.$base_count,
            aptos_count: this.$aptos_count,
            linea_count: this.$linea_count,
            scroll_count: this.$scroll_count,
            evm_count: this.$evm_count,
        }
    },
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
