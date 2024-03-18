import * as StockEvents from "../types/StockEvents.js";

export const formatDate = (date) =>
	new Date(date).toLocaleString("en-US", {
		year: "numeric",
		month: "2-digit",
		day: "2-digit",
	});

export const sortStockEventsByDate = (stockEvents) =>
	stockEvents.sort((a, b) => a.date - b.date);

export const mostRecentRecordPriorToDate = (
	date,
	records,
	dateFetcher,
	defaultReturn = {}
) =>
	records.reduce((mostRecentRecord, currentRecord) => {
		const currentDate = dateFetcher(currentRecord);
		const recentDate = dateFetcher(mostRecentRecord);
		const isMostRecent = currentDate <= date && currentDate > recentDate;
		return isMostRecent ? currentRecord : mostRecentRecord;
	}, defaultReturn);

export const createTimeSeriesFromData = (
	data,
	dataXAccessor = (x) => x,
	dataYAccessor = (y) => y
) =>
	data.map((datum) => ({
		x: dataXAccessor(datum),
		y: dataYAccessor(datum),
	}));

export const runningTotalOfIssuedStocksByDate = (stockEvents) => {
	// Filter stock events to only include ISSUE and VEST events
	const issuedStockEvents = stockEvents.filter(
		(event) =>
			event.type === StockEvents.StockEventType.ISSUE ||
			event.type === StockEvents.StockEventType.VEST // TODO: exercising options as soon as they vest is not a good assumption
	);

	// Create a time series of issued shares
	return issuedStockEvents.reduce((runningTotals, stockEvent) => {
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

export const createAccountsFromStockEvents = (stockEvents) =>
	stockEvents.reduce((accounts, stockEvent) => {
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
			(account) => account.name === stockEvent.owner
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
				(record) => record.date,
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
	ownershipPercents,
	owner,
	date,
	ownedStockCount,
	issuedStockTotal
) {
	if (issuedStockTotal === 0) {
		console.error(`No issued shares as of ${formatDate(date)}. Skipping...`);
		return;
	}

	const datapoint = {
		x: formatDate(date),
		y: (ownedStockCount / issuedStockTotal) * 100,
	};

	let ownerSeries = ownershipPercents.find((series) => series.name === owner);
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
	issuedStocksEvents,
	accounts
) => {
	return issuedStocksEvents.reduce((tempOwnershipPercents, stockEvent) => {
		const date = stockEvent.date;
		// Returns the number of issued shares prior to the given date
		const currentIssuedShares = mostRecentRecordPriorToDate(
			date,
			issuedStocksEvents,
			(record) => record.date,
			{ date: new Date(0), issuedStocks: 0 }
		).issuedStocks;

		accounts.forEach((account) => {
			const recentAccountStatement = mostRecentRecordPriorToDate(
				date,
				account.statements,
				(record) => record.date,
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
