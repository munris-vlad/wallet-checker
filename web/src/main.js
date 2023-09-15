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
import BalancesView from "@/views/BalancesView"
import EvmView from "@/views/EvmView"

const app = createApp(App)

app.config.globalProperties.$axios = axios.create({
  baseURL: 'http://localhost',
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
        path: '/zora',
        name: 'Zora',
        component: ZoraView,
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
