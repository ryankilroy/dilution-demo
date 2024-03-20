import dynamic from "next/dynamic";
import React, { useEffect, useState } from "react";
import {
	createAccountsFromStockEvents,
	createTimeSeriesOfOwnershipPercents,
	runningTotalOfIssuedStocksByDate,
	sortStockEventsByDate,
} from "../lib/utils";
import * as StockEvents from "../types/StockEvents";
import { StockEvent } from "../types/StockEvents";

const incorporationStockEvents: StockEvent[] = [
	...StockEvents.createStocks(10000000, new Date("2023-01-01")),
	...StockEvents.issueStocks(3950000, new Date("2024-02-02"), "Eren"),
	...StockEvents.issueStocks(3050000, new Date("2024-05-05"), "Mikasa"),
	...StockEvents.grantStocks(2550000, new Date("2025-04-04"), "Armin")
];

const optionsObject: {} = {
	chart: {
		id: "share-chart",
	},
	dataLabels: {
		enabled: false,
	},
	legend: {
		customLegendItems: ["Eren", "Mikasa", "Armin"],
	},
	stroke: {
		width: 3,
		curve: "smooth",
	},
	xaxis: {
		type: "datetime",
	},
	yaxis: {
		labels: {
			formatter: (value: any) => {
				return value ? value.toFixed(0) + "%" : "";
			},
		},
		min: 0,
		max: 100,
	},
};

let Chart = dynamic(() => import("react-apexcharts"), { ssr: false });
const OwnershipChart = () => {
	const [loading, setLoading] = useState(true);
	const chartOptions = optionsObject;
	const [stockEvents, setStockEvents] = useState<StockEvent[]>(incorporationStockEvents);
	const [issuedStockEvents, setIssuedStockEvents] = useState<{ date: Date, issuedStocks: Number }[]>([]);
	const [accounts, setAccounts] = useState([]);
	const [ownershipPercentSeries, setOwnershipPercentSeries] = useState([]);

	// Update issued stocks and accounts when stock events change
	useEffect(() => {
		// Filter out stock creation events
		// TODO: Add functionality around unissued, authorized shares
		const filteredStockEvents = stockEvents.filter((stockEvent) => {
			return stockEvent.type !== StockEvents.StockEventType.CREATE;
		});

		// Sort and create issued stock events
		const sortedStockEvents = sortStockEventsByDate(filteredStockEvents);
		const newIssuedStockEvents =
			runningTotalOfIssuedStocksByDate(sortedStockEvents);
		setIssuedStockEvents(newIssuedStockEvents);

		// Create accounts from stock events
		setAccounts(createAccountsFromStockEvents(sortedStockEvents));
	}, [stockEvents]);

	// Compute new ownership percentages without directly modifying state
	useEffect(() => {
		const newOwnershipPercents = createTimeSeriesOfOwnershipPercents(
			issuedStockEvents,
			accounts
		);
		setOwnershipPercentSeries(newOwnershipPercents);
	}, [issuedStockEvents, accounts]);

	useEffect(() => {
		import("react-apexcharts").then((Charts) => {
			Chart = Charts.default;
			setLoading(false);
		});
	}, []);

	if (loading) {
		return <div>Loading...</div>;
	}

	return (
		<div className="row">
			<div className="mixed-chart">
				<Chart
					options={chartOptions}
					series={ownershipPercentSeries}
					width={500}
				/>
			</div>
		</div>
	);
};

export default OwnershipChart;
