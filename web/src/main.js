import { createApp } from 'vue'
import App from './App.vue'
import { createRouter, createWebHashHistory } from 'vue-router'
import axios from 'axios'
import './assets/tailwind.css'
import ZksyncView from "@/views/ZksyncView"
import HomeView from "@/views/HomeView"
import ZoraView from "@/views/ZoraView"
import SolanaView from "@/views/SolanaView"
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
import ClustersView from './views/ClustersView.vue'
import DebridgeView from './views/DebridgeView.vue'
import RabbyView from './views/RabbyView.vue'
import NftView from './views/NftView.vue'
import GalxeView from './views/GalxeView.vue'
import PolygonzkevmView from './views/PolygonzkevmView.vue'
import JumperView from './views/JumperView.vue'

const app = createApp(App)

app.config.globalProperties.$axios = axios.create({
    baseURL: 'http://' + window.location.host,
    // baseURL: 'http://localhost:3000',
})

await app.config.globalProperties.$axios.get('/api/stats').then((response) => {
    let data = response.data
    app.config.globalProperties.$appconfig = data.config
    app.config.globalProperties.$zk_count = data.zksync_wallets.length
    app.config.globalProperties.$layerzero_count = data.layerzero_wallets.length
    app.config.globalProperties.$wormhole_count = data.wormhole_wallets.length
    app.config.globalProperties.$zkbridge_count = data.zkbridge_wallets.length
    app.config.globalProperties.$hyperlane_count = data.hyperlane_wallets.length
    app.config.globalProperties.$debridge_count = data.debridge_wallets.length
    app.config.globalProperties.$zora_count = data.zora_wallets.length
    app.config.globalProperties.$solana_count = data.solana_wallets.length
    app.config.globalProperties.$base_count = data.base_wallets.length
    app.config.globalProperties.$aptos_count = data.aptos_wallets.length
    app.config.globalProperties.$linea_count = data.linea_wallets.length
    app.config.globalProperties.$scroll_count = data.scroll_wallets.length
    app.config.globalProperties.$polygonzkevm_count = data.polygonzkevm_wallets.length
    app.config.globalProperties.$balance_count = data.balance_wallets.length
    app.config.globalProperties.$evm_count = data.evm_wallets.length
    app.config.globalProperties.$clusters_count = data.clusters_wallets.length
    app.config.globalProperties.$rabby_count = data.rabby_wallets.length
    app.config.globalProperties.$galxe_count = data.galxe_wallets.length
    app.config.globalProperties.$jumper_count = data.jumper_wallets.length
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
        path: '/jumper',
        name: 'Jumper',
        component: JumperView,
        meta: { title: 'Jumper' }
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
        path: '/debridge',
        name: 'Debridge',
        component: DebridgeView,
        meta: { title: 'Debridge' }
    },
    {
        path: '/zora',
        name: 'Zora',
        component: ZoraView,
        meta: { title: 'Zora' }
    },
        {
        path: '/solana',
        name: 'Solana',
        component: SolanaView,
        meta: { title: 'Solana' }
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
    {
        path: '/clusters',
        name: 'Clusters',
        component: ClustersView,
        meta: { title: 'Clusters' }
    },
    {
        path: '/rabby',
        name: 'Rabby',
        component: RabbyView,
        meta: { title: 'Rabby' }
    },
    {
        path: '/nft',
        name: 'NFT',
        component: NftView,
        meta: { title: 'NFT' }
    },
    {
        path: '/galxe',
        name: 'Galxe',
        component: GalxeView,
        meta: { title: 'Galxe' }
    },
    {
        path: '/polygonzkevm',
        name: 'Polygonzkevm',
        component: PolygonzkevmView,
        meta: { title: 'Polygon ZKEVM' }
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
