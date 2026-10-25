SELECT
    COUNT(*) AS total_votes,
    COUNT(DISTINCT ("pollId", "voterKey")) AS existing_ballots
FROM "PollVote";
