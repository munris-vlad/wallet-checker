<template>
    <div class="pb-5">
        <div class="min-w-full text-center header pb-4 pt-4">
            <h1 class="text-3xl">Hyperlane</h1>
        </div>
        <div class="flex justify-between items-center pb-1 pt-4 pl-0" v-if="isDataLoaded && !isError">
            <div class="text-gray-500 hover:text-gray-600 px-2 cursor-pointer select-none pl-0 w-32"></div>
            <div class="bg-gray-500 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded cursor-pointer select-none mb-2" @click="refreshData">
                Refresh data
            </div>
        </div>
        <table class="min-w-full border text-center text-sm font-light dark:border-gray-700" v-if="isDataLoaded && !isError">
            <thead class="border-b font-medium dark:border-gray-700">
                <tr>
                    <th v-for="(head, index) in headers" :key="index" :class="thClass" @click="sort(head)">{{ head }}</th>
                </tr>
            </thead>
            <tbody>
                <tr v-for="(item, index) in sortedData" :key="index" class="border-b dark:border-gray-700">
                    <td :class="tdClass">{{ item['n'] }}</td>
                    <td :class="tdClass + ' text-left'">
                        <div class="flex space-x-2 pt-3 pb-2">
                            <strong>{{ item['Wallet'] }}</strong>
                            <div class="h-4 w-4">
                                <a target="_blank" :href="'https://debank.com/profile/'+item['Wallet']"><img class="rounded-full mb-1" :src="'/debank.png'" alt=""></a>
                            </div>
                            <div class="h-4 w-4">
                                <a target="_blank" :href="'https://explorer.hyperlane.xyz/?search='+item['Wallet']"><img class="rounded-full mb-1" :src="'/hyperlane.png'" alt=""></a>
                            </div>
                        </div>
                    </td>
                    <td :class="tdClass">{{ item['Airdrop'] }}</td>
                    <td :class="tdClass">{{ item['TX Count'] }}</td>
                    <td :class="tdClass">{{ item['Source chains'] }}</td>
                    <td :class="tdClass + ' text-left'">
                        <div class="flex space-x-2 pt-3 pb-4 select-none max-w-sm">
                            <div class="h-4 w-4 text-center" v-for="source in item['sources']" :key="source" :title="names[source]">
                                <img class="rounded-full mb-1" :src="chains[source]" :alt="source">
                            </div>
                        </div>
                    </td>
                    <td :class="tdClass">{{ item['Dest chains'] }}</td>
                    <td :class="tdClass + ' text-left'">
                        <div class="flex space-x-2 pt-3 pb-4 select-none max-w-sm">
                            <div class="h-4 w-4 text-center" v-for="source in item['dests']" :key="source" :title="names[source]">
                                <img class="rounded-full mb-1" :src="chains[source]" :alt="source">
                            </div>
                        </div>
                    </td>
                    <td :class="tdClass">{{ item['Days'] }}</td>
                    <td :class="tdClass">{{ item['Weeks'] }}</td>
                    <td :class="tdClass">{{ item['Months'] }}</td>
                    <td :class="tdClass">{{ formatDate(item['First TX']) }}</td>
                    <td :class="tdClass">{{ formatDate(item['Last TX']) }}</td>
                    <td :class="tdClass">
                        <button class="cursor-pointer refresh text-blue-400 text-xl" @click="fetchWallet(item['Wallet'], index)" :disabled="loading[index]">
                            <svg :class="{ 'motion-safe:animate-spin': loading[index] }" class="text-blue-400" fill="#3B82F6" height="15px" width="15px" version="1.1" id="Capa_1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" viewBox="0 0 489.645 489.645" xml:space="preserve"><g id="SVGRepo_bgCarrier" stroke-width="0"></g><g id="SVGRepo_tracerCarrier" stroke-linecap="round" stroke-linejoin="round"></g><g id="SVGRepo_iconCarrier"> <g> <path d="M460.656,132.911c-58.7-122.1-212.2-166.5-331.8-104.1c-9.4,5.2-13.5,16.6-8.3,27c5.2,9.4,16.6,13.5,27,8.3 c99.9-52,227.4-14.9,276.7,86.3c65.4,134.3-19,236.7-87.4,274.6c-93.1,51.7-211.2,17.4-267.6-70.7l69.3,14.5 c10.4,2.1,21.8-4.2,23.9-15.6c2.1-10.4-4.2-21.8-15.6-23.9l-122.8-25c-20.6-2-25,16.6-23.9,22.9l15.6,123.8 c1,10.4,9.4,17.7,19.8,17.7c12.8,0,20.8-12.5,19.8-23.9l-6-50.5c57.4,70.8,170.3,131.2,307.4,68.2 C414.856,432.511,548.256,314.811,460.656,132.911z"></path> </g> </g></svg>
                        </button>
                    </td>
                </tr>
            </tbody>
        </table>
        <div class="text-center text-2xl" v-if="!isDataLoaded && !isError">
          Data loading...
        </div>

        <div class="text-center text-2xl" v-if="isError">
          Error: {{ error }}
        </div>
    </div>
</template>

<script>

import {sortMethods} from "@/utils/sorting"
import {formatDate} from "@/utils/formatDate"
import {thClass, tdClass} from "@/utils/tableClass"

export default {
    data() {
        return {
            chains: {
                56: "https://metaid.zkbridge.com/ipfs/QmYE28H3ncCfJpPpBTHjctS8JXqpAE2PcpyASXskJX7W3x",
                204: "https://metaid.zkbridge.com/ipfs/QmXZ6rJVuQvUEAmyXqf3ge8F9MPBmpsFTyw8JuAPrd1ZGz",
                1: "https://metaid.zkbridge.com/ipfs/QmQwHJfugddURdgb7sRDDcmB1KQ5agEwr3x8ycMzn4oivp",
                137: "https://metaid.zkbridge.com/ipfs/QmTGWBsfRcZxp271EZjSyG4rVc5tNqfM2QgYYDE2g5Tha4",
                9980: "https://metaid.zkbridge.com/ipfs/Qme8ZfwnXySMo9guJ8L4SaMpz8yctoXUSBhjK8ejLWQKFf",
                42161: "https://metaid.zkbridge.com/ipfs/QmNtqDmGK8pAkk2DE5AM1nTyfwXx8mX5n1z4TtsEuX1MCG",
                59144: "https://metaid.zkbridge.com/ipfs/QmZrLSqUGhHsjTpzKi44KM9kARuUduRJZP6Tojj6cQV2jp",
                8453: "https://metaid.zkbridge.com/ipfs/QmYApnAuqM3NNFUebWe6JFUWpfJ2JptwjsXMZak7xHzE8Q",
                10: "https://metaid.zkbridge.com/ipfs/QmWs2tYY2uFhPdDnHuX3qPSyq5wk5fVo6YMevEVFzb6pGR",
                534352: "https://metaid.zkbridge.com/ipfs/QmNTeXADBrwZLaVJ5BvTYj4PRjy46RVvCmH1feth45qJ9j",
                5000: "https://metaid.zkbridge.com/ipfs/QmRBFhRTDF5Nrt4cVZdfCXGUpVjEgmmg1uhcvFQjdnZXCH",
                1116: "https://metaid.zkbridge.com/ipfs/QmVanQW9TArscCkfzEc7LE7KeDjQGMZaMQ3GG4YcV13rP5",
                42220: "https://metaid.zkbridge.com/ipfs/Qme4XCrAWB9ktxnG2ohQZsPERhWwRRzNuJurhU5Cu58awC",
                42170: "https://metaid.zkbridge.com/ipfs/QmZJZEXkrZz19nZ3Qtrp9CmvzaDGyh9niz4mknV451nZoR",
                169: "https://metaid.zkbridge.com/ipfs/QmU2xMH85iyrw8cyWRkRNjTzmZm3s2oDPB5HdcxNRSD9wa",
                8217: "https://metaid.zkbridge.com/ipfs/QmXTajaUkm9JKvYr5WTdmPr4UFWcaX5M9PeE3YL9gYSpuv",
                1284: "https://metaid.zkbridge.com/ipfs/QmTzZMPaGi7G7LDvcGFqzy6mJnJdmEkTsHDX1ZPHgWq34R",
                100: "https://metaid.zkbridge.com/ipfs/QmTjNviQP35skTW7Tp3FEM1Fz4HdYCEtkVyPRNXAT2DUVM",
                43114: "https://metaid.zkbridge.com/ipfs/QmRvckcMjKbiKTGopttPLpRdSMSfPWkkGdMCrYdj5Au3VB",
                250: "https://metaid.zkbridge.com/ipfs/QmWBgdmkY6YoaWGCqEmSCsZ54DfFBGNbDTaAEr7bXRi1ZH",
                1088: "https://metaid.zkbridge.com/ipfs/QmRiDaenMbJGxssJDBdTFyFvzGhHDHtqynV5dtAPhgFPpu",
                324: "https://metaid.zkbridge.com/ipfs/QmXHne2TfV4CRHq6DQzVgZBrJFHg4YcMCodzBPDshG6hTo",
                42262: "https://metaid.zkbridge.com/ipfs/QmdqJYRFxUoCTkLoYKz2AKxj6CjQZ89jfmNuxpTrkjTPTv",
                97: "https://metaid.zkbridge.com/ipfs/QmTBAngYXaK454QRuCFbeFdY3hffRLjef1PhJNvK9ysxQ4",
                5611: "https://metaid.zkbridge.com/ipfs/QmY6ek9T5aYATeDgMe35dKFK1okE5etr1ynUE4M115ETWw",
                5: "https://metaid.zkbridge.com/ipfs/QmQwHJfugddURdgb7sRDDcmB1KQ5agEwr3x8ycMzn4oivp",
                11155111: "https://metaid.zkbridge.com/ipfs/QmQwHJfugddURdgb7sRDDcmB1KQ5agEwr3x8ycMzn4oivp",
                80001: "https://metaid.zkbridge.com/ipfs/QmTGWBsfRcZxp271EZjSyG4rVc5tNqfM2QgYYDE2g5Tha4",
                421613: "https://metaid.zkbridge.com/ipfs/QmNtqDmGK8pAkk2DE5AM1nTyfwXx8mX5n1z4TtsEuX1MCG",
                43113: "https://metaid.zkbridge.com/ipfs/QmRvckcMjKbiKTGopttPLpRdSMSfPWkkGdMCrYdj5Au3VB",
                4002: "https://metaid.zkbridge.com/ipfs/QmWBgdmkY6YoaWGCqEmSCsZ54DfFBGNbDTaAEr7bXRi1ZH",
                59140: "https://metaid.zkbridge.com/ipfs/QmZrLSqUGhHsjTpzKi44KM9kARuUduRJZP6Tojj6cQV2jp",
                420: "https://metaid.zkbridge.com/ipfs/QmWs2tYY2uFhPdDnHuX3qPSyq5wk5fVo6YMevEVFzb6pGR",
                91715: "https://metaid.zkbridge.com/ipfs/QmWNevgHPoraMQYCuvTJxBGF9T2vf7BKtQ2WNSbpg67t6Z",
                588: "https://metaid.zkbridge.com/ipfs/QmRiDaenMbJGxssJDBdTFyFvzGhHDHtqynV5dtAPhgFPpu",
                1287: "https://metaid.zkbridge.com/ipfs/QmTzZMPaGi7G7LDvcGFqzy6mJnJdmEkTsHDX1ZPHgWq34R",
                167005: "https://metaid.zkbridge.com/ipfs/QmcgUwYGCrPTvob9hSRwpHLmvUpyVp54b4CHtW9PowPhwA",
                167007: "https://metaid.zkbridge.com/ipfs/QmcgUwYGCrPTvob9hSRwpHLmvUpyVp54b4CHtW9PowPhwA",
                5001: "https://metaid.zkbridge.com/ipfs/QmX7HEqhRkw8PuP8JL52etSwVowqhgZ7q9kbe77vSaXDam",
                534353: "https://metaid.zkbridge.com/ipfs/QmNTeXADBrwZLaVJ5BvTYj4PRjy46RVvCmH1feth45qJ9j",
                3441005: "https://metaid.zkbridge.com/ipfs/QmekQvuJeEjpArjUh2LaUk4HD8prrpUu4387A1fxqUnGuW",
                9000: "https://metaid.zkbridge.com/ipfs/QmVkNAq7AcZZBoWCjZNJz1xNBpRDC3NucL9LycydCP7CQL",
                42261: "https://metaid.zkbridge.com/ipfs/QmdqJYRFxUoCTkLoYKz2AKxj6CjQZ89jfmNuxpTrkjTPTv",
                7777777: "https://raw.githubusercontent.com/hyperlane-xyz/hyperlane-registry/main/chains/zoramainnet/logo.svg",
                57073: "https://raw.githubusercontent.com/hyperlane-xyz/hyperlane-registry/main/chains/ink/logo.svg",
                167000: "https://raw.githubusercontent.com/hyperlane-xyz/hyperlane-registry/main/chains/taiko/logo.svg",
                2818: "https://raw.githubusercontent.com/hyperlane-xyz/hyperlane-registry/main/chains/morph/logo.svg",
                690: "https://raw.githubusercontent.com/hyperlane-xyz/hyperlane-registry/main/chains/redstone/logo.svg"
            },
            names: {
                56: "BNB Chain",
                204: "opBNB",
                1: "Ethereum",
                137: "Polygon",
                9980: "Combo",
                42161: "Arbitrum One",
                59144: "Linea",
                8453: "Base",
                10: "Optimism",
                534352: "Scroll",
                5000: "Mantle",
                1116: "Core Dao",
                42220: "Celo",
                42170: "Arbitrum Nova",
                169: "Manta Pacific",
                8217: "Klaytn",
                1284: "Moonbeam",
                100: "Gnosis Chain",
                43114: "Avalanche",
                250: "Fantom",
                1088: "Metis",
                324: "zkSync Era",
                42262: "Oasis",
                97: "BNB Chain Testnet",
                5611: "opBNB Testnet",
                5: "Ethereum Goerli Testnet",
                11155111: "Ethereum Sepolia Testnet",
                80001: "Polygon Testnet",
                421613: "Arbitrum One Testnet",
                43113: "Avalanche Testnet",
                4002: "Fantom Testnet",
                59140: "Linea Testnet",
                420: "Optimism Testnet",
                91715: "Combo Testnet",
                588: "Metis Testnet",
                1287: "Moonbase Testnet",
                167005: "Taiko Grimsvotn L2",
                167007: "Taiko Jolnir L2",
                5001: "Mantle Testnet",
                534353: "Scroll Alpha",
                3441005: "Manta Pacific Testnet",
                9000: "Evmos Testnet",
                42261: "Oasis Emerald Testnet",
            },
            isDataLoaded: false,
            isError: false,
            error: '',
            data: [],
            thClass: thClass,
            tdClass: tdClass,
            sortDirection: 1,
            sortBy: 'n',
            loading: [],
            headers: [
                'n',
                'Wallet',
                'Airdrop',
                'TX Count',
                'Source chains',
                'Source list',
                'Dest chains',
                'Dest list',
                'Days',
                'Weeks',
                'Months',
                'First TX',
                'Last TX',
            ]
        }
    },
    created() {
        this.loadData()
    },
    computed: {
        sortedData: {
            get() {
                return this.data
            },
            set(value) {
                this.data = value
            },
        },
    },
    methods: {
        formatDate,
        loadData() {
            this.$axios.get('/api/hyperlane').then((response) => {
                this.data = response.data.sort((a, b) => a.n - b.n)
                this.isDataLoaded = true
            }).catch((error) => {
                this.isError = true
                this.error = error.toString()
            })
        },
        sort(head) {
            this.sortBy = head
            this.sortDirection *= -1
            this.sortData()
        },
        sortData() {
            const type = this.sortBy === 'name' ? 'String' : 'Number'
            const direction = this.sortDirection
            const head = this.sortBy
            this.sortedData = this.data.slice().sort(sortMethods(type, head, direction))
        },
        fetchWallet(wallet, index) {
            this.loading[index] = true
            this.$axios.get('/api/hyperlane/refresh', {params: {wallet: wallet}}).then(() => {
                this.loadData()
                this.loading[index] = false
            }).catch((error) => {
                this.isError = true
                this.error = error.toString()
            })
        },
        refreshData() {
            this.isDataLoaded = false
            this.$axios.get('/api/hyperlane/clean').then(() => {
                this.loadData()
            }).catch((error) => {
                this.isError = true
                this.error = error.toString()
            })
        }
    },
}
</script>

<style>
</style>
