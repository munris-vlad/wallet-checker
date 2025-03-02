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
import ClustersView from './views/ClustersView.vue'
import DebridgeView from './views/DebridgeView.vue'
import RabbyView from './views/RabbyView.vue'
import NftView from './views/NftView.vue'
import GalxeView from './views/GalxeView.vue'
import PolygonzkevmView from './views/PolygonzkevmView.vue'
import JumperView from './views/JumperView.vue'
import AuthView from './views/AuthView.vue'
import StoryView from './views/StoryView.vue'
import EclipseView from './views/EclipseView.vue'
import PointsView from './views/PointsView.vue'
import AirdropView from './views/AirdropView.vue'
import MorphView from './views/MorphView.vue'
import SoneiumView from './views/SoneiumView.vue'
import MonadView from './views/MonadView.vue'
import ConfigView from './views/ConfigView.vue'
import PolymarketView from './views/PolymarketView.vue'

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
    app.config.globalProperties.$story_count = data.story_wallets.length
    app.config.globalProperties.$eclipse_count = data.eclipse_wallets.length
    app.config.globalProperties.$morph_count = data.morph_wallets.length
    app.config.globalProperties.$points_count = data.points_wallets.length
    app.config.globalProperties.$soneium_count = data.soneium_wallets.length
    app.config.globalProperties.$monad_count = data.monad_wallets.length
    app.config.globalProperties.$polymarket_count = data.polymarket_wallets.length
}).catch((error) => {
    console.error('Ошибка при загрузке данных:', error)
})



const routes = [
    {
        path: '/login',
        name: 'Login',
        component: AuthView,
        meta: { title: 'Login' }
    },
    {
        path: '/',
        name: 'Home',
        component: HomeView,
        meta: { requiresAuth: true, title: 'Wallet checker' }
    },
    {
        path: '/config',
        name: 'Config',
        component: ConfigView,
        meta: { requiresAuth: true, title: 'Config' }
    },
    {
        path: '/polymarket',
        name: 'Polymarket',
        component: PolymarketView,
        meta: { requiresAuth: true, title: 'Polymarket' }
    },
    {
        path: '/eclipse',
        name: 'Eclipse',
        component: EclipseView,
        meta: { requiresAuth: true, title: 'Eclipse' }
    },
    {
        path: '/soneium',
        name: 'Soneium',
        component: SoneiumView,
        meta: { requiresAuth: true, title: 'Soneium' }
    },
    {
        path: '/monad',
        name: 'Monad',
        component: MonadView,
        meta: { requiresAuth: true, title: 'Monad' }
    },
    {
        path: '/morph',
        name: 'Morph',
        component: MorphView,
        meta: { requiresAuth: true, title: 'Morph' }
    },
    {
        path: '/zksync',
        name: 'ZkSync',
        component: ZksyncView,
        meta: { requiresAuth: true, title: 'ZkSync' }
    },
    {
        path: '/story',
        name: 'Story',
        component: StoryView,
        meta: { requiresAuth: true, title: 'Story' }
    },
    {
        path: '/jumper',
        name: 'Jumper',
        component: JumperView,
        meta: { requiresAuth: true, title: 'Jumper' }
    },
    {
        path: '/layerzero',
        name: 'Layerzero',
        component: LayerzeroView,
        meta: { requiresAuth: true, title: 'Layerzero' }
    },
    {
        path: '/wormhole',
        name: 'Wormhole',
        component: WormholeView,
        meta: { requiresAuth: true, title: 'Wormhole' }
    },
    {
        path: '/zkbridge',
        name: 'Zkbridge',
        component: ZkbridgeView,
        meta: { requiresAuth: true, title: 'Zkbridge' }
    },
    {
        path: '/hyperlane',
        name: 'Hyperlane',
        component: HyperlaneView,
        meta: { requiresAuth: true, title: 'Hyperlane' }
    },
    {
        path: '/debridge',
        name: 'Debridge',
        component: DebridgeView,
        meta: { requiresAuth: true, title: 'Debridge' }
    },
    {
        path: '/zora',
        name: 'Zora',
        component: ZoraView,
        meta: { requiresAuth: true, title: 'Zora' }
    },
    {
        path: '/base',
        name: 'Base',
        component: BaseView,
        meta: { requiresAuth: true, title: 'Base' }
    },
    {
        path: '/scroll',
        name: 'Scroll',
        component: ScrollView,
        meta: { requiresAuth: true, title: 'Scroll' }
    },
    {
        path: '/aptos',
        name: 'Aptos',
        component: AptosView,
        meta: { requiresAuth: true, title: 'Aptos' }
    },
    {
        path: '/linea',
        name: 'Linea',
        component: LineaView,
        meta: { requiresAuth: true, title: 'Linea' }
    },
    {
        path: '/balances',
        name: 'Balances',
        component: BalancesView,
        meta: { requiresAuth: true, title: 'Balances' }
    },
    {
        path: '/evm',
        name: 'EVM',
        component: EvmView,
        meta: { requiresAuth: true, title: 'EVM' }
    },
    {
        path: '/clusters',
        name: 'Clusters',
        component: ClustersView,
        meta: { requiresAuth: true, title: 'Clusters' }
    },
    {
        path: '/rabby',
        name: 'Rabby',
        component: RabbyView,
        meta: { requiresAuth: true, title: 'Rabby' }
    },
    {
        path: '/nft',
        name: 'NFT',
        component: NftView,
        meta: { requiresAuth: true, title: 'NFT' }
    },
    {
        path: '/galxe',
        name: 'Galxe',
        component: GalxeView,
        meta: { requiresAuth: true, title: 'Galxe' }
    },
    {
        path: '/polygonzkevm',
        name: 'Polygonzkevm',
        component: PolygonzkevmView,
        meta: { requiresAuth: true, title: 'Polygon ZKEVM' }
    },
    {
        path: '/points',
        name: 'Points',
        component: PointsView,
        meta: { requiresAuth: true, title: 'Points' }
    },
    {
        path: '/airdrop',
        name: 'Airdrop',
        component: AirdropView,
        meta: { requiresAuth: true, title: 'Airdrop' }
    },
]

const router = new createRouter({
    routes: routes,
    history: createWebHashHistory(),
})


router.beforeEach((to, from, next) => {
    document.title = to.meta.title
    const isAuthenticated = JSON.parse(localStorage.getItem('isAuthenticated')) || false

    if (!app.config.globalProperties.$appconfig.auth.enabled) {
        localStorage.setItem('isAuthenticated', true)
        next()
    } else {
        if (to.meta.requiresAuth && !isAuthenticated) {
            next({ name: 'Login' })
        } else {
            next()
        }
    }
})

app.use(router)
app.mount('#app')
