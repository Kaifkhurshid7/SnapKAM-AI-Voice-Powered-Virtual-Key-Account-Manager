# Assumptions

The assignment brief allows reasonable assumptions as long as they are stated. These are all of them.

## Seller profile

- The seller is a fictional persona: **Aarav Sharma**, store **Sharma Home & Kitchen**, category Home & Kitchen.
- The store has **60 active listings**. This is needed to express 18 out-of-stock products as a share of the catalogue (about 30%).

## Metrics and derived figures

- The five metrics (sales, orders, cancellation rate, average selling price, out-of-stock products) are taken exactly from the brief.
- Sales equals orders multiplied by average selling price (270 x ₹500 = ₹1,35,000), so the whole sales drop is a **volume** drop. Price is not the cause.
- "Extra cancelled orders" is estimated as this month's orders multiplied by the rise in cancellation rate (270 x 6% = about 16 orders), valued at the average selling price (about ₹8,000). It is an estimate, not a measured loss.
- Month-over-month changes of less than 2% are treated as "flat".

## Visibility

- The dataset contains no impressions, traffic or search-rank data. "Low visibility" is therefore an **inference**: orders fell while price stayed flat, and stock-outs and cancellations are known to hurt marketplace ranking. The bot is instructed to present it as a likely effect and to ask the seller about promotions and search position.

## Recommendations

- Recommendations are general marketplace practice (restocking, order fulfilment hygiene, promotions). They do not refer to specific Snapdeal programmes or features, because no Snapdeal internal information is used.

## Language

- English and Hindi are supported for speech input and output. Hindi depends on the LLM engine; the offline fallback engine replies in English only.
- Speech recognition and synthesis use the browser's Web Speech API, so the voice experience requires Chrome or Edge.
