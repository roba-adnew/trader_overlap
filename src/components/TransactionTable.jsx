import PropTypes from "prop-types";

export function TransactionTable({ transactions }) {
    const exportToCsv = () => {
        const headers = ["Wallet", "Token", "Type", "Amount", "Profit"];
        const csvContent = [
            headers.join(","),
            ...transactions.map((tx) =>
                [
                    tx.wallet,
                    tx.token,
                    tx.type,
                    tx.amount,
                    tx.profit || "0",
                ].join(",")
            ),
        ].join("\n");

        const blob = new Blob([csvContent], { type: "text/csv" });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = "token_transactions.csv";
        a.click();
        window.URL.revokeObjectURL(url);
    };

    return (
        <div className="transaction-table">
            <div className="table-header">
                <h2>Transaction Results</h2>
                <button onClick={exportToCsv} className="button">
                    Export to CSV
                </button>
            </div>

            <div className="table-container">
                <table>
                    <thead>
                        <tr>
                            <th>Wallet</th>
                            <th>Token</th>
                            <th>Type</th>
                            <th>Amount</th>
                            <th>Profit (SOL)</th>
                        </tr>
                    </thead>
                    <tbody>
                        {transactions.map((tx, index) => (
                            <tr key={index}>
                                <td className="monospace">{tx.wallet}</td>
                                <td className="monospace">{tx.token}</td>
                                <td
                                    className={
                                        tx.type === "BUY" ? "buy" : "sell"
                                    }
                                >
                                    {tx.type}
                                </td>
                                <td>{tx.amount}</td>
                                <td>
                                    {tx.profit !== null
                                        ? `${tx.profit > 0 ? "+" : ""}${
                                              tx.profit
                                          } SOL`
                                        : "-"}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}

TransactionTable.propTypes = {
    transactions: PropTypes.arrayOf(
        PropTypes.shape({
            wallet: PropTypes.string.isRequired,
            token: PropTypes.string.isRequired,
            type: PropTypes.oneOf(["BUY", "SELL"]).isRequired,
            amount: PropTypes.number.isRequired,
            profit: PropTypes.number,
        })
    ).isRequired,
};
