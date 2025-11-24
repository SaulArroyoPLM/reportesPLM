import React, { useState } from "react";
import { Form, Badge } from "react-bootstrap";

export default function ChipInput({
    items,
    setItems,
    placeholder = "Escribe y presiona Enter",
    validate,          // función opcional (para validar emails o lo que quieras)
    badgeColor = "primary"
}) {
    const [inputValue, setInputValue] = useState("");

    const handleKeyDown = (e) => {
        if (e.key === "Enter" || e.key === ",") {
            e.preventDefault();

            const value = inputValue.trim();

            if (!value) return;

            // Si se mandó una función de validación (ej: email)
            if (validate && !validate(value)) {
                return;
            }

            // Evita duplicados
            if (!items.includes(value)) {
                setItems([...items, value]);
            }

            setInputValue("");
        }
    };

    const removeItem = (val) => {
        setItems(items.filter((item) => item !== val));
    };

    return (
        <div>
            {/* Chips */}
            <div className="mb-2">
                {items.map((item, index) => (
                    <Badge key={index} pill bg={badgeColor} className="me-2">
                        {item}{" "}
                        <span
                            style={{ cursor: "pointer", marginLeft: 4 }}
                            onClick={() => removeItem(item)}
                        >
                            ✕
                        </span>
                    </Badge>
                ))}
            </div>

            {/* Input */}
            <Form.Control
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={placeholder}
                autoComplete="off"
            />
        </div>
    );
}
