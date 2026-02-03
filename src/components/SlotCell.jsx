function SlotCell({ status, onToggle }) {
    return (
        <div
            className={`slot-cell ${status}`}
            onClick={onToggle}
        >
            {status === "livre" ? "livre" : "BES 2023"}
        </div>
    )
}

export default SlotCell

