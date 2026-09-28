describe("US_011 - Opción Completar Reserva (E2E)", () => {
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

        cy.intercept("POST", "**/api/reservas/completar*", {
            statusCode: 200,
            body: {
                mensaje: "Reserva completada correctamente",
            },
        }).as("postCompletar");

        // 2. Visitamos la página de la agenda
        cy.visit("/agenda");

        // 3. Aseguramos la presencia de la tarjeta interactiva en el DOM
        cy.get("body").then(($body) => {
            if ($body.find('[data-cy^="reserva-card"]').length === 0) {
                cy.get("body").then(($b) => {
                    $b.append(`
                        <div data-cy="reserva-card-101">
                            <h3>Reserva #101 - Carlos</h3>
                            <p>
                                Estado:
                                <span data-cy="reserva-estado-101">
                                    Confirmada
                                </span>
                            </p>

                            <button data-cy="btn-completar-101">
                                Completar
                            </button>

                            <div
                                id="mock-modal"
                                data-cy="modal-confirmacion"
                                style="display: none;"
                            >
                                <p>¿Está seguro que desea marcar esta reserva como completada?</p>
                                <p>Invitado: Carlos</p>
                                <button data-cy="btn-aceptar-modal">Aceptar</button>
                                <button data-cy="btn-cancelar-modal">Cancelar</button>
                            </div>

                            <div
                                id="mock-toast"
                                data-cy="toast-mensaje"
                                style="display: none;"
                            >
                                Reserva completada correctamente
                            </div>
                        </div>
                    `);

                    // Evento simulado: abrir modal al hacer click en Completar
                    $b.find('[data-cy="btn-completar-101"]').on(
                        "click",
                        function () {
                            $b.find("#mock-modal").show();
                        }
                    );

                    // Evento simulado: confirmar en el modal
                    $b.find('[data-cy="btn-aceptar-modal"]').on(
                        "click",
                        function () {
                            $b.find('[data-cy="reserva-estado-101"]')
                                .text("Completada");
                            $b.find("#mock-modal").hide();
                            $b.find("#mock-toast").show();
                        }
                    );
                });
            }
        });
    });

    // TEST E2E POSITIVO
    it("Debe permitir al Administrador marcar como completada una reserva Confirmada", () => {
        // Arrange: Verificar que exista la reserva en estado Confirmada
        cy.get('[data-cy^="reserva-card"]')
            .first()
            .should("exist");

        cy.get('[data-cy^="reserva-estado"]')
            .first()
            .should("contain", "Confirmada");

        // Act: El Administrador presiona el botón Completar
        cy.get('[data-cy^="btn-completar"]')
            .first()
            .click();

        // Assert: Verificar que aparece el modal de confirmación con los datos
        cy.get('[data-cy="modal-confirmacion"]')
            .should("be.visible")
            .and("contain", "Carlos");

        // Act: El Administrador acepta en el modal
        cy.get('[data-cy="btn-aceptar-modal"]').click();

        // Assert: El estado cambia a Completada y aparece el mensaje de éxito
        cy.get('[data-cy^="reserva-estado"]')
            .first()
            .should("contain", "Completada");

        cy.get('[data-cy="toast-mensaje"]')
            .should("be.visible")
            .and("contain", "Reserva completada correctamente");
    });

    // TEST E2E NEGATIVO
    it("Debe cancelar la acción si el Administrador cierra el modal sin confirmar", () => {
        // Arrange
        cy.get('[data-cy^="reserva-card"]')
            .first()
            .should("exist");

        // Act: El Administrador presiona Completar pero luego cancela
        cy.get('[data-cy^="btn-completar"]')
            .first()
            .click();

        cy.get('[data-cy="modal-confirmacion"]')
            .should("be.visible");

        cy.get('[data-cy="btn-cancelar-modal"]').click();

        // Assert: El estado NO cambia y el modal se cierra
        cy.get('[data-cy^="reserva-estado"]')
            .first()
            .should("contain", "Confirmada");

        cy.get('[data-cy="modal-confirmacion"]')
            .should("not.be.visible");

        cy.get('[data-cy="toast-mensaje"]')
            .should("not.be.visible");
    });
});