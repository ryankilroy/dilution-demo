import * as StockEvents from "../types/StockEvents";
import { StockEvent } from "../types/StockEvents";

export const formatDate = (date: string | number | Date) =>
	new Date(date).toLocaleString("en-US", {
		year: "numeric",
		month: "2-digit",
		day: "2-digit",
	});

export const sortStockEventsByDate = (stockEvents: StockEvent[]) =>
	// Sort stock events by date
	// Convert the date object to a number before comparing 
	stockEvents.sort((a: { date: Date; }, b: { date: Date; }) => +a.date - +b.date);

export const mostRecentRecordPriorToDate = (
	date: number,
	records: any[],
	dateFetcher: { (record: any): any; (record: any): any; (record: any): any; (arg0: any): any; },
	defaultReturn = {}
) =>
	records.reduce((mostRecentRecord: any, currentRecord: any) => {
		const currentDate = dateFetcher(currentRecord);
		const recentDate = dateFetcher(mostRecentRecord);
		const isMostRecent = currentDate <= date && currentDate > recentDate;
		return isMostRecent ? currentRecord : mostRecentRecord;
	}, defaultReturn);

export const createTimeSeriesFromData = (
	data: any[],
	dataXAccessor = (x: any) => x,
	dataYAccessor = (y: any) => y
) =>
	data.map((datum: any) => ({
		x: dataXAccessor(datum),
		y: dataYAccessor(datum),
	}));

export const runningTotalOfIssuedStocksByDate = (stockEvents: StockEvent[]) => {
	// Filter stock events to only include ISSUE and VEST events
	const issuedStockEvents = stockEvents.filter(
		(event: { type: StockEvents.StockEventType; }) =>
			event.type === StockEvents.StockEventType.ISSUE ||
			event.type === StockEvents.StockEventType.VEST // TODO: exercising options as soon as they vest is not a good assumption
	);

	// Create a time series of issued shares
	return issuedStockEvents.reduce((runningTotals: { date: Date, issuedStocks: number; }[], stockEvent: StockEvent) => {
		// Get the most recent total of issued shares
		const currentIssuedShares =
			runningTotals.length >= 1
				? runningTotals[runningTotals.length - 1].issuedStocks
				: 0;

		// Add the new total to the array
		runningTotals.push({
			date: stockEvent.date,
			issuedStocks: currentIssuedShares + stockEvent.numberOfShares,
		});
		return runningTotals;
	}, []);
};

export const createAccountsFromStockEvents = (stockEvents: any[]) =>
	stockEvents.reduce((accounts: { name: any; statements: { date: any; ownedStock: any; unvestedStock: any; }[]; }[], stockEvent: { type: StockEvents.StockEventType; date: any; numberOfShares: number; owner: any; }) => {
		// Construct a new account statement from the stock event
		const isUnvested = stockEvent.type === StockEvents.StockEventType.GRANT;
		const newAccountStatement = {
			date: stockEvent.date,
			ownedStock: isUnvested ? 0 : stockEvent.numberOfShares,
			unvestedStock: isUnvested ? stockEvent.numberOfShares : 0,
		};
		// Convert shares from unvested to vested if the stock event is a VEST
		if (stockEvent.type === StockEvents.StockEventType.VEST)
			newAccountStatement.unvestedStock -= stockEvent.numberOfShares;

		const existingAccount = accounts.find(
			(account: { name: any; }) => account.name === stockEvent.owner
		);
		// This is the first stock event for this entity, create a new account
		if (!existingAccount) {
			accounts.push({
				name: stockEvent.owner,
				statements: [newAccountStatement],
			});
		} else {
			// If the account already exists, add the new statement to the account
			const recentAccountStatement = mostRecentRecordPriorToDate(
				stockEvent.date,
				existingAccount.statements,
				(record: { date: any; }) => record.date,
				{ date: new Date(0), ownedStock: 0, unvestedStock: 0 }
			);

			// Add the previous stock count to the new statement
			newAccountStatement.ownedStock += recentAccountStatement.ownedStock;
			newAccountStatement.unvestedStock += recentAccountStatement.unvestedStock;
			existingAccount.statements.push(newAccountStatement);
		}
		return accounts;
	}, []);

function addOwnershipPercentToSeries(
	ownershipPercents: any[],
	owner: any,
	date: string | number | Date,
	ownedStockCount: number,
	issuedStockTotal: number
) {
	if (issuedStockTotal === 0) {
		console.error(`No issued shares as of ${formatDate(date)}. Skipping...`);
		return;
	}

	const datapoint = {
		x: formatDate(date),
		y: (ownedStockCount / issuedStockTotal) * 100,
	};

	let ownerSeries = ownershipPercents.find((series: { name: any; }) => series.name === owner);
	if (!ownerSeries) {
		ownerSeries = {
			name: owner,
			type: "area",
			data: [],
		};
		ownershipPercents.push(ownerSeries);
	}

	ownerSeries.data.push(datapoint);
}

export const createTimeSeriesOfOwnershipPercents = (
	issuedStocksEvents: any[],
	accounts: any[]
) => {
	return issuedStocksEvents.reduce((tempOwnershipPercents: any, stockEvent: { date: any; }) => {
		const date = stockEvent.date;
		// Returns the number of issued shares prior to the given date
		const currentIssuedShares = mostRecentRecordPriorToDate(
			date,
			issuedStocksEvents,
			(record: { date: any; }) => record.date,
			{ date: new Date(0), issuedStocks: 0 }
		).issuedStocks;

		accounts.forEach((account: { statements: any; name: any; }) => {
			const recentAccountStatement = mostRecentRecordPriorToDate(
				date,
				account.statements,
				(record: { date: any; }) => record.date,
				{ date: new Date(0), ownedStock: 0, unvestedStock: 0 }
			);
			const ownedStockCount = recentAccountStatement.ownedStock;
			// Instead of modifying state, modify a temporary variable
			addOwnershipPercentToSeries(
				tempOwnershipPercents,
				account.name,
				date,
				ownedStockCount,
				currentIssuedShares
			);
		});

		return tempOwnershipPercents;
	}, []);
};
