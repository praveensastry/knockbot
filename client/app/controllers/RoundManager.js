class RoundManager {
    constructor () {

    }
    
    // get number of rounds in a tournament
    static getNumberOfRounds (numberOfTeams, teamsPerMatch) {
        let rounds = 1;
        for(let teamCount = teamsPerMatch; teamCount < numberOfTeams; teamCount *= teamsPerMatch) {
            rounds++;
        }
        return rounds;
    }

	// get match ups of a round
    static getMatchUpsOfRound (teamsOfCurrentRound, teamsPerMatch, initData = null) {
        
        if (initData != null) {
            return initData;
        }

		let matchUps = [];
        let teamsInMatchUp = [];

		for (let i = 0; i < teamsOfCurrentRound.length; i++) {
			teamsInMatchUp.push(teamsOfCurrentRound[i].id);

			if (teamsInMatchUp.length == teamsPerMatch) {
				matchUps.push({
					match: matchUps.length,
					teamIds: teamsInMatchUp.splice(0)
				});
			}
		}

        return matchUps;
    }
    
}