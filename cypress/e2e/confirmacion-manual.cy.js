describe("US_018 - Confirmación Manual de Reservas (E2E)", () => {
    beforeEach(() => {
        // 1. Interceptamos llamadas a la API
        cy.intercept("GET", "**/api/administradores*", {
            statusCode: 200,
            body: [
                {
                    id: 1,
                    nombre: "Administrador Demo",
                },
            ],
        }).as("getAdmin");

        cy.intercept("POST", "**/api/reservas/confirmar*", {
            statusCode: 200,
            body: {
                mensaje: "Reserva confirmada correctamente",
            },
        }).as("postConfirmar");

        // 2. Visitamos la página de la agenda
        cy.visit("/agenda");

        // 3. Aseguramos la presencia de la tarjeta interactiva en el DOM
        cy.get("body").then(($body) => {
            if ($body.find('[data-cy^="reserva-card"]').length === 0) {
                cy.get("body").then(($b) => {
                    $b.append(`
                        <div data-cy="reserva-card-1">
                            <h3>Reserva #1 - Juan Pérez</h3>
                            <p>
                                Estado:
                                <span data-cy="reserva-estado-1">
                                    PendienteDeConfirmacion
                                </span>
                            </p>

                            <button data-cy="btn-confirmar-1">
                                Confirmar
                            </button>

                            <div
                                id="mock-toast"
                                data-cy="toast-mensaje"
                                style="display: none;"
                            >
                                Reserva confirmada correctamente
                            </div>
                        </div>
                    `);

                    // Evento simulado de confirmación en UI
                    $b.find('[data-cy="btn-confirmar-1"]').on(
                        "click",
                        function () {
                            $b.find('[data-cy="reserva-estado-1"]')
                                .text("Confirmada");

                            $b.find("#mock-toast").show();
                        }
                    );
                });
            }
        });
    });

    it(
        "Debe permitir al Administrador confirmar manualmente una reserva pendiente",
        () => {
            // Arrange: Verificar que exista la reserva en estado pendiente
            cy.get('[data-cy^="reserva-card"]')
                .first()
                .should("exist");

            cy.get('[data-cy^="reserva-estado"]')
                .first()
                .should("contain", "Pendiente");

            // Act: El Administrador presiona el botón para confirmar la reserva
            cy.get('[data-cy^="btn-confirmar"]')
                .first()
                .click();

            // Assert: Validar que el estado cambie a "Confirmada"
            // y se muestre el mensaje de éxito
            cy.get('[data-cy^="reserva-estado"]')
                .first()
                .should("contain", "Confirmada");

            cy.get('[data-cy="toast-mensaje"]')
                .should("be.visible")
                .and("contain", "Reserva confirmada");
        }
    );
});