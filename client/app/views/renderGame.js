"use strict";

const initTournament = () => {
    const tooltipForTeamsPerMatch = document.getElementById("message_teamsPerMatch");
    const tooltipForNumberOfTeams = document.getElementById("message_numberOfTeams");

    // onChange of numberOfTeams text box
    document.getElementById("numberOfTeams").addEventListener("change", () => {
        // hide error message
        hideMessage(tooltipForNumberOfTeams);
    });
    // onChange of teamsPerMatch text box
    document.getElementById("teamsPerMatch").addEventListener("change", () => {
        // hide error message
        hideMessage(tooltipForTeamsPerMatch);
    });   
    

    // onClick event of START button
    document.getElementById("start").addEventListener("click", () => {
        const txtNumberOfTeams = document.getElementById("numberOfTeams");
        const numberOfTeams = parseInt(txtNumberOfTeams.value);
        const txtTeamsPerMatch = document.getElementById("teamsPerMatch");
        const teamsPerMatch = parseInt(txtTeamsPerMatch.value);
        
        // hide error message if it is opened
        hideMessage(tooltipForTeamsPerMatch);
        hideMessage(tooltipForNumberOfTeams);

        const winner = document.getElementById("winner");
        const gameMap = document.getElementById("gameMap");
        const gameMsg = document.getElementById("gameMsg");
        const btnStart = document.getElementById("start");

        // hiden winner info
        winner.innerText = "";
        winner.className = "hidden";
        gameMsg.innerText = "Game is loading...";

        // redraw match ups squares
        gameMap.innerHTML = "";

        txtNumberOfTeams.setAttribute("disabled", "disabled");
        txtTeamsPerMatch.setAttribute("disabled", "disabled");
        btnStart.setAttribute("disabled", "disabled");

        //start game
        startTournament(teamsPerMatch, numberOfTeams).then((data) => {
            
            txtNumberOfTeams.removeAttribute("disabled");
            txtTeamsPerMatch.removeAttribute("disabled");
            btnStart.removeAttribute("disabled");
            
            if (data.hasOwnProperty("error")) {

                if (data.errorAt == "tournament") {
                    displayMessage(tooltipForNumberOfTeams, data.message);
                }
                else {
                    displayMessage(tooltipForNumberOfTeams, "There was an error from server. \nPlease try again later!");
                }
                
                txtTeamsPerMatch.focus();
                txtTeamsPerMatch.select();
                gameMsg.innerText = "";

            }
            else {
                // show winner info
                gameMsg.innerText = "is the Winner.";
                winner.innerText = data.winner.name;
                winner.className = "";
            }
        });
        
        
    });
}


// initial setup for game
const initGame = (numberOfMatchUps) => {

    const winner = document.getElementById("winner");
    const gameMap = document.getElementById("gameMap");

    // hiden winner info
    winner.innerText = "";
    winner.className = "hidden";

    // redraw match ups squares
    gameMap.innerHTML = "";

    for (let i = 0; i < numberOfMatchUps; i++) {
        let matchSquare = document.createElement("li");
        matchSquare.setAttribute("id", `match-${i}`);

        gameMap.appendChild(matchSquare);
    }
}


// start the tournament game
const startTournament = async (teamsPerMatch, numberOfTeams) => {

    //Fetching Tournament info from server
    const request = getRequestHeader("/tournament", "POST", `numberOfTeams=${numberOfTeams}&teamsPerMatch=${teamsPerMatch}`);
    const tournamentData = await (await fetch(request)).json();
    
    // check error message
    if (tournamentData.hasOwnProperty("error")) {
        tournamentData.errorAt = "tournament";
        return tournamentData;
    }

	let tournamentItem = new Tournament();
	tournamentItem.id = tournamentData.tournamentId;
	tournamentItem.teamsPerMatch = teamsPerMatch;
    tournamentItem.rounds = [];
    tournamentItem.teams = [];

    //create list of the teams in the tournament
    let gameMsg = document.getElementById("gameMsg");

    for (let match_item of tournamentData.matchUps) {

        for (let team_id of match_item.teamIds) {

            //creating Team
            let team = new Team();
            team.id = team_id;
            team.tournamentId = tournamentItem.id;

            // retrieve Team info from server
            const request = getRequestHeader("/team", "GET", `tournamentId=${tournamentItem.id}&teamId=${team.id}`);
            const teamData = await (await fetch(request)).json();

            // check error message
            if (teamData.hasOwnProperty("error")) {
                teamData.errorAt = "team";
                return teamData;
            }

            team.name = teamData.name;
            team.score = teamData.score;

            // add team to the Team List
            tournamentItem.teams.push(team);

            // send message on UI
            gameMsg.innerText = `Game is loading...${Math.ceil((team_id + 1)*100 / numberOfTeams)}%...`;
        }
    }

    // Init game
    let numberOfMatchUps = MatchUpManager.getNumberOfMatchUps (numberOfTeams, teamsPerMatch);
    //we use this to mark current match on UI
    let currentMatchIndex = 0;
    initGame(numberOfMatchUps);

    // create tournament data
    let numberOfRounds = RoundManager.getNumberOfRounds(numberOfTeams, teamsPerMatch);
    let currentRoundId = 0;

    // all teams will join in the first round - also determine the winners of a round
    let winnersOfRound = tournamentItem.teams;

    do {
        // send message on UI
        gameMsg.innerText = `ROUND ${currentRoundId + 1}`;

        let round = new Round();
        round.id = currentRoundId;
        round.tournamentId = tournamentItem.id;
        round.matchUps = [];

        // get matchups of this round
        let matchDataOfRound;
        if (currentRoundId == 0) {
            matchDataOfRound = RoundManager.getMatchUpsOfRound(winnersOfRound, tournamentItem.teamsPerMatch, tournamentData.matchUps);
        }
        else {
            matchDataOfRound = RoundManager.getMatchUpsOfRound(winnersOfRound, tournamentItem.teamsPerMatch); 
        }

        // clear team list for next round
        winnersOfRound = [];

        // get match list of this round
        for (let match_item of matchDataOfRound) {
            // send message on UI
            let matchElement = document.getElementById(`match-${currentMatchIndex}`);
            // mark this match is being played
            matchElement.className = "playing";
            gameMsg.innerText = `ROUND ${currentRoundId + 1} - MATCH ${match_item.match + 1}`;

            let match = new MatchUp();
            match.id = match_item.match;
            match.roundId = round.id; 
            match.tournamentId = tournamentItem.id;
            match.teams = [];

            // retrieve Match score from server
            let getMatchRequest = getRequestHeader("/match", "GET", `tournamentId=${tournamentItem.id}&round=${match.roundId}&match=${match.id}`);
            let matchUpData = await (await fetch(getMatchRequest)).json();

            // check error message
            if (matchUpData.hasOwnProperty("error")) {
                matchUpData.errorAt = "match";
                return matchUpData;
            }

            match.score = matchUpData.score;

            // params to determine winner
            let winnerParams = `tournamentId=${tournamentItem.id}&matchScore=${match.score}`; 

            // get team list of this match
            for (let team_id of match_item.teamIds) {

                // add team to this match
                match.teams.push(tournamentItem.teams[team_id]);

                // add team score to params
                winnerParams += "&teamScores=" + tournamentItem.teams[team_id].score;
            }

            // retrieve Winner Score from server
            let request = getRequestHeader("/winner", "GET", winnerParams);
            let winnerScoreData = await (await fetch(request)).json();

            // get winner of this match
            match.winner = match.teams.find((a) => {
                return a.score == winnerScoreData.score;
            });

            // mark this match is done on the UI
            // document.getElementById(`match-${currentMatchIndex}`).className = "done";
            matchElement.className = "done";
            currentMatchIndex++;
            winnersOfRound.push(match.winner);
            round.matchUps.push(match);
        }

        tournamentItem.rounds.push(round);
        currentRoundId++;
    }
    while (currentRoundId < numberOfRounds);

    // get the winner of tournament
    tournamentItem.winner = winnersOfRound[0];
    return tournamentItem;
}














