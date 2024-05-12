import { dirname } from 'path'
import { fileURLToPath } from 'url'
import express from 'express'
import cors from 'cors'
import { zkSyncData } from "../checkers/zksync.js"
import { zoraData } from "../checkers/zora.js"
import { baseData } from "../checkers/base.js"
import { aptosData } from "../checkers/aptos.js"
import { lineaData } from "../checkers/linea.js"
import { scrollData } from "../checkers/scroll.js"
import { balancesData } from "../checkers/balances.js"
import { evmData } from "../checkers/evm.js"
import { readWallets } from "./common.js"
import { layerzeroData } from "../checkers/layerzero.js"
import { wormholeData } from '../checkers/wormhole.js'
import { zkbridgeData } from '../checkers/zkbridge.js'
import { hyperlaneData } from '../checkers/hyperlane.js'
import { clustersData } from '../checkers/clusters.js'
import { debridgeData } from '../checkers/debridge.js'
import { config } from '../_user_data/config.js'

const app = express()
const port = config.port
const apiRoutes = express.Router()

app.use(cors())
app.use('/api', apiRoutes)

app.use(express.static('./web/dist'))

app.get('*', (req, res) => {
    res.sendFile('./web/dist/index.html')
})

apiRoutes.get('/stats', async (req, res) => {
    const zksyncWallets = readWallets(config.modules.zksync.addresses)
    const layerzeroWallets = readWallets(config.modules.layerzero.addresses)
    const wormholeWallets = readWallets(config.modules.wormhole.addresses)
    const debridgeWallets = readWallets(config.modules.debridge.addresses)
    const zkbridgeWallets = readWallets(config.modules.zkbridge.addresses)
    const hyperlaneWallets = readWallets(config.modules.hyperlane.addresses)
    const zoraWallets = readWallets(config.modules.zora.addresses)
    const baseWallets = readWallets(config.modules.base.addresses)
    const aptosWallets = readWallets(config.modules.aptos.addresses)
    const lineaWallets = readWallets(config.modules.linea.addresses)
    const scrollWallets = readWallets(config.modules.scroll.addresses)
    const clustersWallets = readWallets(config.modules.clusters.addresses)
    const evmWallets = readWallets(config.modules.evm.addresses)
    const balanceWallets = readWallets(config.modules.balance.addresses)

    res.json({
        'config': config,
        'zksync_wallets': zksyncWallets,
        'layerzero_wallets': layerzeroWallets,
        'zkbridge_wallets': zkbridgeWallets,
        'hyperlane_wallets': hyperlaneWallets,
        'wormhole_wallets': wormholeWallets,
        'debridge_wallets': debridgeWallets,
        'zora_wallets': zoraWallets,
        'base_wallets': baseWallets,
        'aptos_wallets': aptosWallets,
        'linea_wallets': lineaWallets,
        'scroll_wallets': scrollWallets,
        'clusters_wallets': clustersWallets,
        'evm_wallets': evmWallets,
        'balance_wallets': balanceWallets,
    })
})

apiRoutes.get('/zksync', async (req, res) => {
    const responseData = await zkSyncData()
    res.json(responseData)
})

apiRoutes.get('/wormhole', async (req, res) => {
    const responseData = await wormholeData()
    res.json(responseData)
})

apiRoutes.get('/debridge', async (req, res) => {
    const responseData = await debridgeData()
    res.json(responseData)
})

apiRoutes.get('/layerzero', async (req, res) => {
    const responseData = await layerzeroData()
    res.json(responseData)
})

apiRoutes.get('/zkbridge', async (req, res) => {
    const responseData = await zkbridgeData()
    res.json(responseData)
})

apiRoutes.get('/hyperlane', async (req, res) => {
    const responseData = await hyperlaneData()
    res.json(responseData)
})

apiRoutes.get('/zora', async (req, res) => {
    const responseData = await zoraData()
    res.json(responseData)
})

apiRoutes.get('/base', async (req, res) => {
    const responseData = await baseData()
    res.json(responseData)
})

apiRoutes.get('/aptos', async (req, res) => {
    const responseData = await aptosData()
    res.json(responseData)
})

apiRoutes.get('/linea', async (req, res) => {
    const responseData = await lineaData()
    res.json(responseData)
})

apiRoutes.get('/scroll', async (req, res) => {
    const responseData = await scrollData()
    res.json(responseData)
})

apiRoutes.get('/balances', async (req, res) => {
    const network = req.query.network ? req.query.network : 'eth'
    const responseData = await balancesData(network)
    res.json(responseData)
})

apiRoutes.get('/evm', async (req, res) => {
    const network = req.query.network ? req.query.network : 'eth'
    const responseData = await evmData(network)
    res.json(responseData)
})

apiRoutes.get('/clusters', async (req, res) => {
    const responseData = await clustersData()
    res.json(responseData)
})

app.listen(port, () => {
    console.log(`Wallet checker web version started: http://localhost${port == 80 ? '' : ':' + port}`)
})