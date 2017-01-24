package net.corda.vega.api

import com.opengamma.strata.product.swap.FixedRateCalculation
import com.opengamma.strata.product.swap.IborRateCalculation
import com.opengamma.strata.product.swap.RateCalculationSwapLeg
import com.opengamma.strata.product.swap.SwapLegType
import net.corda.core.contracts.hash
import net.corda.core.crypto.Party
import net.corda.vega.contracts.IRSState
import net.corda.vega.contracts.PortfolioState
import net.corda.vega.portfolio.Portfolio
import java.time.LocalDate
import java.util.concurrent.ThreadLocalRandom

/**
 * API JSON generation functions for larger JSON outputs.
 */
class PortfolioApiUtils(private val ownParty: Party) {
    data class InitialMarginView(val baseCurrency: String, val post: Map<String, Double>, val call: Map<String, Double>, val agreed: Boolean)
    data class ValuationsView(
            val businessDate: LocalDate,
            val portfolio: Map<String, Any>,
            val marketData: Map<String, Any>,
            val sensitivities: Map<String, Any>,
            val initialMargin: InitialMarginView,
            val confirmation: Map<String, Any>)


    fun randomStatus():Boolean{
        var randomNumber = ThreadLocalRandom.current().nextInt(0,10);
        var result =randomNumber%7!=0;
        return result
    }
    fun createValuations(state: PortfolioState, portfolio: Portfolio): ValuationsView {
        val valuation = state.valuation!!

        val currency = if (portfolio.trades.isNotEmpty()) {
            portfolio.swaps.first().toView(ownParty).currency
        } else {
            ""
        }

        val tradeCount = portfolio.trades.size
        val marketData = valuation.marketData.values.map { it.key.replace("OG-Ticker~", "") to it.value }.toMap()
        val yieldCurveCurrenciesValues = marketData.filter { !it.key.contains("/") }.map { it -> Triple(it.key.split("-")[0], it.key.split("-", limit = 2)[1], it.value) }
        val grouped = yieldCurveCurrenciesValues.groupBy { it.first }
        val subgroups = grouped.map { it.key to it.value.groupBy { v -> v.second } }.toMap()

        val completeSubgroups = subgroups.mapValues { it.value.mapValues { it.value[0].third.toDouble() }.toSortedMap() }

        val yieldCurves = mapOf(
                "name" to "EUR",
                "values" to completeSubgroups.get("EUR")!!.filter { !it.key.contains("Fixing") }.map {
                    mapOf(
                            "tenor" to it.key,
                            "rate" to it.value
                    )
                }
        )

        val fixings = mapOf(
                "name" to "EUR",
                "values" to completeSubgroups.get("EUR")!!.filter { it.key.contains("Fixing") }.map {
                    mapOf(
                            "tenor" to it.key,
                            "rate" to it.value
                    )
                }
        )

        val processedSensitivities = valuation.totalSensivities.sensitivities.map { it.marketDataName to it.parameterMetadata.map { it.label }.zip(it.sensitivity.toList()).toMap() }.toMap()

        val initialMarginView = InitialMarginView(
                baseCurrency = currency,
                post = mapOf(
                        "IRFX" to valuation.margin.first,
                        "commodity" to 0.0,
                        "equity" to 0.0,
                        "credit" to 0.0,
                        "total" to valuation.margin.first
                ),
                call = mapOf(
                        "IRFX" to valuation.margin.first,
                        "commodity" to 0.0,
                        "equity" to 0.0,
                        "credit" to 0.0,
                        "total" to valuation.margin.first
                ),
                agreed = randomStatus())

        return ValuationsView(
                businessDate = LocalDate.now(),
                portfolio = mapOf(
                        "trades" to tradeCount,
                        "baseCurrency" to currency,
                        "IRFX" to tradeCount,
                        "commodity" to 0,
                        "equity" to 0,
                        "credit" to 0,
                        "total" to tradeCount,
                        "agreed" to randomStatus()
                ),
                marketData = mapOf(
                        "yieldCurves" to yieldCurves,
                        "fixings" to fixings,
                        "agreed" to randomStatus()
                ),
                sensitivities = mapOf("curves" to processedSensitivities,
                        "currency" to valuation.currencySensitivies.amounts.toList().map {
                            mapOf(
                                    "currency" to it.currency.code,
                                    "amount" to it.amount
                            )
                        },
                        "agreed" to randomStatus()
                ),
                initialMargin = initialMarginView,
                confirmation = mapOf(
                        "hash" to state.hash().toString(),
                        "agreed" to randomStatus()
                )
        )
    }

    data class TradeView(
            val fixedLeg: Map<String, Any>,
            val floatingLeg: Map<String, Any>,
            val common: Map<String, Any>,
            val ref: String)

    fun createTradeView(state: IRSState): TradeView {
        val trade = if (state.buyer.name == ownParty.name) state.swap.toFloatingLeg() else state.swap.toFloatingLeg()
        val fixedLeg = trade.product.legs.first { it.type == SwapLegType.FIXED } as RateCalculationSwapLeg
        val floatingLeg = trade.product.legs.first { it.type != SwapLegType.FIXED } as RateCalculationSwapLeg
        val fixedRate = fixedLeg.calculation as FixedRateCalculation
        val floatingRate = floatingLeg.calculation as IborRateCalculation

        return TradeView(
                fixedLeg = mapOf(
                        "fixedRatePayer" to state.buyer.name,
                        "notional" to mapOf(
                                "token" to fixedLeg.currency.code,
                                "quantity" to fixedLeg.notionalSchedule.amount.initialValue
                        ),
                        "paymentFrequency" to fixedLeg.paymentSchedule.paymentFrequency.toString(),
                        "effectiveDate" to fixedLeg.startDate.unadjusted,
                        "terminationDate" to fixedLeg.endDate.unadjusted,
                        "fixedRate" to mapOf(
                                "value" to fixedRate.rate.initialValue
                        ),
                        "paymentRule" to fixedLeg.paymentSchedule.paymentRelativeTo.name,
                        "calendar" to listOf("TODO"),
                        "paymentCalendar" to mapOf<String, Any>() // TODO
                ),
                floatingLeg = mapOf(
                        "floatingRatePayer" to state.seller.name,
                        "notional" to mapOf(
                                "token" to floatingLeg.currency.code,
                                "quantity" to floatingLeg.notionalSchedule.amount.initialValue
                        ),
                        "paymentFrequency" to floatingLeg.paymentSchedule.paymentFrequency.toString(),
                        "effectiveDate" to floatingLeg.startDate.unadjusted,
                        "terminationDate" to floatingLeg.endDate.unadjusted,
                        "index" to floatingRate.index.name,
                        "paymentRule" to floatingLeg.paymentSchedule.paymentRelativeTo,
                        "calendar" to listOf("TODO"),
                        "paymentCalendar" to listOf("TODO"),
                        "fixingCalendar" to mapOf<String, Any>() // TODO
                ),
                common = mapOf(
                        "valuationDate" to trade.product.startDate.unadjusted,
                        "hashLegalDocs" to state.contract.legalContractReference.toString(),
                        "interestRate" to mapOf(
                                "name" to "TODO",
                                "oracle" to "TODO",
                                "tenor" to mapOf(
                                        "name" to "TODO"
                                )
                        )
                ),
                ref = trade.info.id.get().value
        )
    }
}