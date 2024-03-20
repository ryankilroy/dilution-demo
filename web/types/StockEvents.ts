export enum StockEventType {
	CREATE = "CREATE", // Unassigned shares are created with no owner
	ISSUE = "ISSUE", // Shares are issued to the owner
	GRANT = "GRANT", // RSU or Stock Option is granted to the owner
	VEST = "VEST", // Unvested shares vest
	// SELL: "SELL",						// Future feature
	// EXERCISE: "EXERCISE"			// Future feature
};

export type StockEvent = Readonly<{
	owner: null | string;
	type: StockEventType;
	date: Date;
	numberOfShares: number;
}>;

function createStocks(numberOfShares: number, date: Date): StockEvent[] {
	return [{
		owner: null,
		type: StockEventType.CREATE,
		date,
		numberOfShares,
	}];
}

function issueStocks(numberOfShares: number, date: Date, owner: string): StockEvent[] {
	return [{
		owner,
		type: StockEventType.ISSUE,
		date,
		numberOfShares,
	}];
}

enum VestScheduleType {
	LINEAR = "LINEAR",
	CLIFF = "CLIFF",
}

type VestSchedule = Readonly<{
	type: VestScheduleType;
	numberOfShares: number;
	startDate: Date;
	endDate: Date;
}>;

const defaultVestSchedules = (numberOfShares: number, date: Date): VestSchedule[] => {
	const cliffDate = new Date(date);
	cliffDate.setFullYear(cliffDate.getFullYear() + 1);
	const linearDate = new Date(cliffDate);
	linearDate.setFullYear(linearDate.getFullYear() + 3);
	const numOfCliffShares = numberOfShares / 4;
	return [
		{
			type: VestScheduleType.CLIFF,
			numberOfShares: numOfCliffShares,
			startDate: date,
			endDate: cliffDate,
		},
		{
			type: VestScheduleType.LINEAR,
			numberOfShares: numberOfShares - numOfCliffShares,
			startDate: cliffDate,
			endDate: linearDate,
		},
	];
};

function vestStocks(numberOfShares: number, date: Date, owner: string): StockEvent[] {
	return [
		{
			owner,
			type: StockEventType.VEST,
			date,
			numberOfShares,
		},
	];
}

function grantStocks(
	numberOfShares: number,
	date: Date,
	owner: string,
	vestSchedules: VestSchedule[] = []
): StockEvent[] {
	if (vestSchedules.length === 0) {
		vestSchedules = defaultVestSchedules(numberOfShares, date);
	}
	let GrantStockEvents: StockEvent[] = [];
	GrantStockEvents.push({
		owner,
		type: StockEventType.GRANT,
		date,
		numberOfShares,
	});
	vestSchedules.forEach((vestSchedule) => {
		if (vestSchedule.type === VestScheduleType.CLIFF) {
			GrantStockEvents = GrantStockEvents.concat(
				vestStocks(vestSchedule.numberOfShares, vestSchedule.endDate, owner)
			);
		} else {
			const numOfVestEvents =
				(vestSchedule.endDate.getFullYear() - vestSchedule.startDate.getFullYear()) * 12 +
				(vestSchedule.endDate.getMonth() - vestSchedule.startDate.getMonth());
			const monthlyShares = vestSchedule.numberOfShares / numOfVestEvents;
			for (let i = 1; i <= numOfVestEvents; i++) {
				let vestDate = new Date(vestSchedule.startDate);
				vestDate.setMonth(vestSchedule.startDate.getMonth() + i);
				GrantStockEvents = GrantStockEvents.concat(
					vestStocks(monthlyShares, vestDate, owner)
				);
			}
		}
	});
	return GrantStockEvents;
}

export {
	createStocks,
	grantStocks,
	issueStocks,
	vestStocks
};

