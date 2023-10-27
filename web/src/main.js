import { createApp } from 'vue'
import App from './App.vue'
import {createRouter, createWebHashHistory} from 'vue-router'
import axios from 'axios'
import './assets/tailwind.css'
import ZksyncView from "@/views/ZksyncView"
import StarknetView from "@/views/StarknetView"
import HomeView from "@/views/HomeView"
import ZoraView from "@/views/ZoraView"
import AptosView from "@/views/AptosView"
import LineaView from "@/views/LineaView"
import ScrollView from "@/views/ScrollView"
import BalancesView from "@/views/BalancesView"
import EvmView from "@/views/EvmView"
import LayerzeroView from "@/views/LayerzeroView"
import BaseView from "@/views/BaseView"

const app = createApp(App)

app.config.globalProperties.$axios = axios.create({
  baseURL: 'http://'+window.location.host,
  // baseURL: 'http://localhost:3000',
})

await app.config.globalProperties.$axios.get('/api/stats').then((response) => {
    let data = response.data
    app.config.globalProperties.$zk_count = data.zksync_wallets.length
    app.config.globalProperties.$stark_count = data.starknet_wallets.length
    app.config.globalProperties.$layerzero_count = data.layerzero_wallets.length
    app.config.globalProperties.$zora_count = data.zora_wallets.length
    app.config.globalProperties.$base_count = data.base_wallets.length
    app.config.globalProperties.$aptos_count = data.aptos_wallets.length
    app.config.globalProperties.$linea_count = data.linea_wallets.length
    app.config.globalProperties.$scroll_count = data.scroll_wallets.length
    app.config.globalProperties.$evm_count = data.evm_wallets.length
}).catch((error) => {
    console.error('Ошибка при загрузке данных:', error)
})

const routes = [
    {
        path: '/',
        name: 'Home',
        component: HomeView,
    },
    {
        path: '/zksync',
        name: 'ZkSync',
        component: ZksyncView,
    },
    {
        path: '/starknet',
        name: 'Starknet',
        component: StarknetView,
    },
    {
        path: '/layerzero',
        name: 'Layerzero',
        component: LayerzeroView,
    },
    {
        path: '/zora',
        name: 'Zora',
        component: ZoraView,
    },
    {
        path: '/base',
        name: 'Base',
        component: BaseView,
    },
    {
        path: '/scroll',
        name: 'Scroll',
        component: ScrollView,
    },
    {
        path: '/aptos',
        name: 'Aptos',
        component: AptosView,
    },
    {
        path: '/linea',
        name: 'Linea',
        component: LineaView,
    },
    {
        path: '/balances',
        name: 'Balances',
        component: BalancesView,
    },
    {
        path: '/evm',
        name: 'EVM',
        component: EvmView,
    },
]

const router = new createRouter({
    routes: routes,
    history: createWebHashHistory(),
})

app.use(router)
app.mount('#app')
