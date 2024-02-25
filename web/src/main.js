import { createApp } from 'vue'
import App from './App.vue'
import { createRouter, createWebHashHistory } from 'vue-router'
import axios from 'axios'
import './assets/tailwind.css'
import ZksyncView from "@/views/ZksyncView"
import HomeView from "@/views/HomeView"
import ZoraView from "@/views/ZoraView"
import AptosView from "@/views/AptosView"
import LineaView from "@/views/LineaView"
import ScrollView from "@/views/ScrollView"
import BalancesView from "@/views/BalancesView"
import EvmView from "@/views/EvmView"
import LayerzeroView from "@/views/LayerzeroView"
import WormholeView from "@/views/WormholeView"
import BaseView from "@/views/BaseView"
import ZkbridgeView from "@/views/ZkbridgeView"
import HyperlaneView from "@/views/HyperlaneView"

const app = createApp(App)

app.config.globalProperties.$axios = axios.create({
    baseURL: 'http://' + window.location.host,
    // baseURL: 'http://localhost:3000',
})

await app.config.globalProperties.$axios.get('/api/stats').then((response) => {
    let data = response.data
    app.config.globalProperties.$zk_count = data.zksync_wallets.length
    app.config.globalProperties.$layerzero_count = data.layerzero_wallets.length
    app.config.globalProperties.$wormhole_count = data.wormhole_wallets.length
    app.config.globalProperties.$zkbridge_count = data.zkbridge_wallets.length
    app.config.globalProperties.$hyperlane_count = data.hyperlane_wallets.length
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
        meta: { title: 'Wallet checker' }
    },
    {
        path: '/zksync',
        name: 'ZkSync',
        component: ZksyncView,
        meta: { title: 'ZkSync' }
    },
    {
        path: '/layerzero',
        name: 'Layerzero',
        component: LayerzeroView,
        meta: { title: 'Layerzero' }
    },
    {
        path: '/wormhole',
        name: 'Wormhole',
        component: WormholeView,
        meta: { title: 'Wormhole' }
    },
    {
        path: '/zkbridge',
        name: 'Zkbridge',
        component: ZkbridgeView,
        meta: { title: 'Zkbridge' }
    },
    {
        path: '/hyperlane',
        name: 'Hyperlane',
        component: HyperlaneView,
        meta: { title: 'Hyperlane' }
    },
    {
        path: '/zora',
        name: 'Zora',
        component: ZoraView,
        meta: { title: 'Zora' }
    },
    {
        path: '/base',
        name: 'Base',
        component: BaseView,
        meta: { title: 'Base' }
    },
    {
        path: '/scroll',
        name: 'Scroll',
        component: ScrollView,
        meta: { title: 'Scroll' }
    },
    {
        path: '/aptos',
        name: 'Aptos',
        component: AptosView,
        meta: { title: 'Aptos' }
    },
    {
        path: '/linea',
        name: 'Linea',
        component: LineaView,
        meta: { title: 'Linea' }
    },
    {
        path: '/balances',
        name: 'Balances',
        component: BalancesView,
        meta: { title: 'Balances' }
    },
    {
        path: '/evm',
        name: 'EVM',
        component: EvmView,
        meta: { title: 'EVM' }
    },
]

const router = new createRouter({
    routes: routes,
    history: createWebHashHistory(),
})

router.beforeEach((to, from, next) => {
    document.title = to.meta.title
    next()
})

app.use(router)
app.mount('#app')
