import express from 'express'
import session from "express-session"
import bodyParser from "body-parser"
import cors from 'cors'
import { balancesData } from "../checkers/balances.js"
import { evmData } from "../checkers/evm.js"
import { readWallets } from "./common.js"
import { config } from '../user_data/config.js'
import { galxeData } from '../checkers/galxe.js'
import { zkSyncClean, zkSyncData, zkSyncFetchWallet } from "../checkers/zksync.js"
import { zoraClean, zoraData, zoraFetchWallet } from "../checkers/zora.js"
import { baseClean, baseData, baseFetchWallet } from "../checkers/base.js"
import { aptosClean, aptosData, aptosFetchWallet } from "../checkers/aptos.js"
import { lineaClean, lineaData, lineaFetchWallet } from "../checkers/linea.js"
import { layerzeroClean, layerzeroData, layerzeroFetchWallet } from "../checkers/layerzero.js"
import { wormholeClean, wormholeData, wormholeFetchWallet } from '../checkers/wormhole.js'
import { zkbridgeClean, zkbridgeData, zkbridgeFetchWallet } from '../checkers/zkbridge.js'
import { hyperlaneClean, hyperlaneData, hyperlaneFetchWallet } from '../checkers/hyperlane.js'
import { debridgeClean, debridgeData, debridgeFetchWallet } from '../checkers/debridge.js'
import { jumperClean, jumperData, jumperFetchWallet } from '../checkers/jumper.js'
import { storyClean, storyData, storyFetchWallet } from '../checkers/story.js'
import { eclipseClean, eclipseData, eclipseFetchWallet } from '../checkers/eclipse.js'
import { morphClean, morphData, morphFetchDataAndPrintTable, morphFetchWallet } from '../checkers/morph.js'
import { soneiumClean, soneiumData, soneiumFetchWallet } from '../checkers/soneium.js'
import { monadClean, monadData, monadFetchWallet } from '../checkers/monad.js'
import { polymarketClean, polymarketData, polymarketFetchWallet } from '../checkers/polymarket.js'

const app = express()
const port = config.port
const apiRoutes = express.Router()

app.use(bodyParser.json())
app.use(
    session({
        secret: "walletcheckerbymunris",
        resave: false,
        saveUninitialized: false,
        cookie: { secure: false, httpOnly: true, maxAge: 360000000 }
    })
)

app.post("/api/login", (req, res) => {
    const { username, password } = req.body;

    if (username === config.auth.login && password === config.auth.password) {
        req.session.isAuthenticated = true
        req.session.username = username
        res.json({ message: "Login successful" })
    } else {
        res.status(401).json({ message: "Invalid credentials" })
    }
})

function isAuthenticated(req, res, next) {
    if (!config.auth.enabled) {
        next()
    } else {   
        if (req.session.isAuthenticated) {
            next()
        } else {
            res.sendStatus(401)
        }
    }
}

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
    const evmWallets = readWallets(config.modules.evm.addresses)
    const balanceWallets = readWallets(config.modules.balance.addresses)
    const galxeWallets = readWallets(config.modules.galxe.addresses)
    const jumperWallets = readWallets(config.modules.jumper.addresses)
    const storyWallets = readWallets(config.modules.story.addresses)
    const eclipseWallets = readWallets(config.modules.eclipse.addresses)
    const morphWallets = config.modules.morph ? readWallets(config.modules.morph.addresses) : []
    const soneiumWallets = config.modules.soneium ? readWallets(config.modules.soneium.addresses) : []
    const monadWallets = config.modules.monad ? readWallets(config.modules.monad.addresses) : []
    const polymarketWallets = config.modules.polymarket ? readWallets(config.modules.polymarket.addresses) : []

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
        'evm_wallets': evmWallets,
        'balance_wallets': balanceWallets,
        'galxe_wallets': galxeWallets,
        'jumper_wallets': jumperWallets,
        'story_wallets': storyWallets,
        'eclipse_wallets': eclipseWallets,
        'morph_wallets': morphWallets,
        'soneium_wallets': soneiumWallets,
        'monad_wallets': monadWallets,
        'polymarket_wallets': polymarketWallets,
    })
})

// Polymarket API
apiRoutes.get('/polymarket', isAuthenticated, async (req, res) => {
    const responseData = await polymarketData()
    res.json(responseData)
})

apiRoutes.get('/polymarket/refresh', isAuthenticated, async (req, res) => {
    const wallet = req.query.wallet ? req.query.wallet : ''
    await polymarketFetchWallet(wallet)
    res.json(true)
})

apiRoutes.get('/polymarket/clean', isAuthenticated, async (req, res) => {
    await polymarketClean()
    res.json(true)
})

// MONAD API
apiRoutes.get('/monad', isAuthenticated, async (req, res) => {
    const responseData = await monadData()
    res.json(responseData)
})

apiRoutes.get('/monad/refresh', isAuthenticated, async (req, res) => {
    const wallet = req.query.wallet ? req.query.wallet : ''
    await monadFetchWallet(wallet)
    res.json(true)
})

apiRoutes.get('/monad/clean', isAuthenticated, async (req, res) => {
    await monadClean()
    res.json(true)
})

// SONEIUM API
apiRoutes.get('/soneium', isAuthenticated, async (req, res) => {
    const responseData = await soneiumData()
    res.json(responseData)
})

apiRoutes.get('/soneium/refresh', isAuthenticated, async (req, res) => {
    const wallet = req.query.wallet ? req.query.wallet : ''
    await soneiumFetchWallet(wallet)
    res.json(true)
})

apiRoutes.get('/soneium/clean', isAuthenticated, async (req, res) => {
    await soneiumClean()
    res.json(true)
})

// JUMPER API
apiRoutes.get('/jumper', isAuthenticated, async (req, res) => {
    const responseData = await jumperData()
    res.json(responseData)
})

apiRoutes.get('/jumper/refresh', isAuthenticated, async (req, res) => {
    const wallet = req.query.wallet ? req.query.wallet : ''
    await jumperFetchWallet(wallet)
    res.json(true)
})

apiRoutes.get('/jumper/clean', isAuthenticated, async (req, res) => {
    await jumperClean()
    res.json(true)
})

// ZKSYNC API
apiRoutes.get('/zksync', isAuthenticated, async (req, res) => {
    const responseData = await zkSyncData()
    res.json(responseData)
})

apiRoutes.get('/zksync/refresh', isAuthenticated, async (req, res) => {
    const wallet = req.query.wallet ? req.query.wallet : ''
    await zkSyncFetchWallet(wallet)
    res.json(true)
})

apiRoutes.get('/zksync/clean', isAuthenticated, async (req, res) => {
    await zkSyncClean()
    res.json(true)
})

// WORMHOLE API
apiRoutes.get('/wormhole', isAuthenticated, async (req, res) => {
    const responseData = await wormholeData()
    res.json(responseData)
})

apiRoutes.get('/wormhole/refresh', isAuthenticated, async (req, res) => {
    const wallet = req.query.wallet ? req.query.wallet : ''
    await wormholeFetchWallet(wallet)
    res.json(true)
})

apiRoutes.get('/wormhole/clean', isAuthenticated, async (req, res) => {
    await wormholeClean()
    res.json(true)
})

// DEBRIDGE API
apiRoutes.get('/debridge', isAuthenticated, async (req, res) => {
    const responseData = await debridgeData()
    res.json(responseData)
})

apiRoutes.get('/debridge/refresh', isAuthenticated, async (req, res) => {
    const wallet = req.query.wallet ? req.query.wallet : ''
    await debridgeFetchWallet(wallet)
    res.json(true)
})

apiRoutes.get('/debridge/clean', isAuthenticated, async (req, res) => {
    await debridgeClean()
    res.json(true)
})

// LAYERZERO API
apiRoutes.get('/layerzero', isAuthenticated, async (req, res) => {
    const responseData = await layerzeroData()
    res.json(responseData)
})

apiRoutes.get('/layerzero/refresh', isAuthenticated, async (req, res) => {
    const wallet = req.query.wallet ? req.query.wallet : ''
    await layerzeroFetchWallet(wallet)
    res.json(true)
})

apiRoutes.get('/layerzero/clean', isAuthenticated, async (req, res) => {
    await layerzeroClean()
    res.json(true)
})

// ZKBRIDGE API
apiRoutes.get('/zkbridge', isAuthenticated, async (req, res) => {
    const responseData = await zkbridgeData()
    res.json(responseData)
})

apiRoutes.get('/zkbridge/refresh', isAuthenticated, async (req, res) => {
    const wallet = req.query.wallet ? req.query.wallet : ''
    await zkbridgeFetchWallet(wallet)
    res.json(true)
})

apiRoutes.get('/zkbridge/clean', isAuthenticated, async (req, res) => {
    await zkbridgeClean()
    res.json(true)
})

// HYPERLANE API
apiRoutes.get('/hyperlane', isAuthenticated, async (req, res) => {
    const responseData = await hyperlaneData()
    res.json(responseData)
})

apiRoutes.get('/hyperlane/refresh', isAuthenticated, async (req, res) => {
    const wallet = req.query.wallet ? req.query.wallet : ''
    await hyperlaneFetchWallet(wallet)
    res.json(true)
})

apiRoutes.get('/hyperlane/clean', isAuthenticated, async (req, res) => {
    await hyperlaneClean()
    res.json(true)
})

// ZORA API
apiRoutes.get('/zora', isAuthenticated, async (req, res) => {
    const responseData = await zoraData()
    res.json(responseData)
})

apiRoutes.get('/zora/refresh', isAuthenticated, async (req, res) => {
    const wallet = req.query.wallet ? req.query.wallet : ''
    await zoraFetchWallet(wallet)
    res.json(true)
})

apiRoutes.get('/zora/clean', isAuthenticated, async (req, res) => {
    await zoraClean()
    res.json(true)
})

// BASE API
apiRoutes.get('/base', isAuthenticated, async (req, res) => {
    const responseData = await baseData()
    res.json(responseData)
})

apiRoutes.get('/base/refresh', isAuthenticated, async (req, res) => {
    const wallet = req.query.wallet ? req.query.wallet : ''
    await baseFetchWallet(wallet)
    res.json(true)
})

apiRoutes.get('/base/clean', isAuthenticated, async (req, res) => {
    await baseClean()
    res.json(true)
})

// APTOS API
apiRoutes.get('/aptos', isAuthenticated, async (req, res) => {
    const responseData = await aptosData()
    res.json(responseData)
})

apiRoutes.get('/aptos/refresh', isAuthenticated, async (req, res) => {
    const wallet = req.query.wallet ? req.query.wallet : ''
    await aptosFetchWallet(wallet)
    res.json(true)
})

apiRoutes.get('/aptos/clean', isAuthenticated, async (req, res) => {
    await aptosClean()
    res.json(true)
})

// LINEA API
apiRoutes.get('/linea', isAuthenticated, async (req, res) => {
    const responseData = await lineaData()
    res.json(responseData)
})

apiRoutes.get('/linea/refresh', isAuthenticated, async (req, res) => {
    const wallet = req.query.wallet ? req.query.wallet : ''
    await lineaFetchWallet(wallet)
    res.json(true)
})

apiRoutes.get('/linea/clean', isAuthenticated, async (req, res) => {
    await lineaClean()
    res.json(true)
})


// STORY API
apiRoutes.get('/story', isAuthenticated, async (req, res) => {
    const responseData = await storyData()
    res.json(responseData)
})

apiRoutes.get('/story/refresh', isAuthenticated, async (req, res) => {
    const wallet = req.query.wallet ? req.query.wallet : ''
    await storyFetchWallet(wallet)
    res.json(true)
})

apiRoutes.get('/story/clean', isAuthenticated, async (req, res) => {
    await storyClean()
    res.json(true)
})

// ECLIPSE API
apiRoutes.get('/eclipse', isAuthenticated, async (req, res) => {
    const responseData = await eclipseData()
    res.json(responseData)
})

apiRoutes.get('/eclipse/refresh', isAuthenticated, async (req, res) => {
    const wallet = req.query.wallet ? req.query.wallet : ''
    await eclipseFetchWallet(wallet)
    res.json(true)
})

apiRoutes.get('/eclipse/clean', isAuthenticated, async (req, res) => {
    await eclipseClean()
    res.json(true)
})

// BALANCES API
apiRoutes.get('/balances', isAuthenticated, async (req, res) => {
    const network = req.query.network ? req.query.network : 'eth'
    const responseData = await balancesData(network)
    res.json(responseData)
})

// EVM API
apiRoutes.get('/evm', isAuthenticated, async (req, res) => {
    const network = req.query.network ? req.query.network : 'eth'
    const responseData = await evmData(network)
    res.json(responseData)
})

// MORPH API
apiRoutes.get('/morph', isAuthenticated, async (req, res) => {
    const responseData = await morphData()
    res.json(responseData)
})

apiRoutes.get('/morph/refresh', isAuthenticated, async (req, res) => {
    const wallet = req.query.wallet ? req.query.wallet : ''
    await morphFetchWallet(wallet)
    res.json(true)
})

apiRoutes.get('/morph/clean', isAuthenticated, async (req, res) => {
    await morphClean()
    res.json(true)
})

// GALXE API
apiRoutes.get('/galxe', isAuthenticated, async (req, res) => {
    const space = req.query.space ? req.query.space : 'caldera'
    const responseData = await galxeData(space)
    res.json(responseData)
})

app.listen(port, () => {
    console.log(`Wallet checker web version started: http://localhost${port == 80 ? '' : ':' + port}`)
})