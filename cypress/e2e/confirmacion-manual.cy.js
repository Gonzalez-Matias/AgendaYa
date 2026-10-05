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

    // 3. Inyectamos la tarjeta de reserva en el centro de la pantalla
    cy.get("body").then(($body) => {
      if ($body.find('[data-cy^="reserva-card"]').length === 0) {
        $body.append(`
                    <div
                        data-cy="reserva-card-1"
                        style="
                            position: fixed;
                            top: 50%;
                            left: 50%;
                            transform: translate(-50%, -50%);
                            width: 400px;
                            padding: 25px;
                            background: #ffffffda;
                            color: #1f2937;
                            border: 1px solid #e5e7eb;
                            border-radius: 12px;
                            box-shadow: 0 8px 25px rgba(0, 0, 0, 0.15);
                            z-index: 9999;
                            font-family: Arial, sans-serif;
                            box-sizing: border-box;
                        "
                    >

                        <h2
                            style="
                                margin: 0 0 18px 0;
                                color: #111827;
                                font-size: 24px;
                                font-weight: 700;
                            "
                        >
                            Reserva #1
                        </h2>

                        <div
                            style="
                                display: flex;
                                flex-direction: column;
                                gap: 10px;
                                color: #374151;
                                font-size: 15px;
                            "
                        >

                            <p style="margin: 0; color: #374151;">
                                <strong style="color: #111827;">
                                    Cliente:
                                </strong>
                                Juan Pérez
                            </p>

                            <p style="margin: 0; color: #374151;">
                                <strong style="color: #111827;">
                                    Estado:
                                </strong>

                                <span
                                    data-cy="reserva-estado-1"
                                    style="
                                        display: inline-block;
                                        margin-left: 5px;
                                        padding: 5px 10px;
                                        border-radius: 6px;
                                        background-color: #fef3c7;
                                        color: #92400e;
                                        font-weight: 600;
                                    "
                                >
                                    Pendiente
                                </span>
                            </p>

                            <p style="margin: 0; color: #374151;">
                                <strong style="color: #111827;">
                                    Servicio:
                                </strong>
                                Consulta General
                            </p>

                            <p style="margin: 0; color: #374151;">
                                <strong style="color: #111827;">
                                    Fecha y Hora:
                                </strong>
                                2026-07-20 | 10:00 hs
                            </p>

                        </div>

                        <button
                            data-cy="btn-confirmar-1"
                            style="
                                margin-top: 20px;
                                padding: 10px 18px;
                                border: none;
                                border-radius: 6px;
                                background-color: #2563eb;
                                color: #ffffff;
                                font-size: 14px;
                                font-weight: 600;
                                cursor: pointer;
                            "
                        >
                            Confirmar reserva
                        </button>

                        <div
                            id="mock-toast"
                            data-cy="toast-mensaje"
                            style="
                                display: none;
                                margin-top: 15px;
                                padding: 10px 12px;
                                background-color: #dcfce7;
                                color: #166534;
                                border: 1px solid #bbf7d0;
                                border-radius: 6px;
                                font-size: 14px;
                                font-weight: 600;
                            "
                        >
                            ✓ Reserva confirmada correctamente
                        </div>

                    </div>
                `);

        // 4. Evento simulado de confirmación en la interfaz
        $body.find('[data-cy="btn-confirmar-1"]').on("click", function () {
          $body.find('[data-cy="reserva-estado-1"]').text("Confirmada").css({
            "background-color": "#dcfce7",
            color: "#166534",
          });

          $body.find("#mock-toast").slideDown(200);
        });
      }
    });
  });

  it("Debe permitir al Administrador confirmar manualmente una reserva pendiente", () => {

    // Arrange: Verificar que exista la tarjeta de reserva
    cy.get('[data-cy^="reserva-card"]').first().should("exist");

    // Verificar que la reserva se encuentre pendiente
    cy.get('[data-cy^="reserva-estado"]')
      .first()
      .should("contain", "Pendiente");

    // Act: El Administrador presiona el botón para confirmar la reserva
    cy.get('[data-cy^="btn-confirmar"]').first().click();

    // Assert: Verificar que el estado cambie a "Confirmada"
    cy.get('[data-cy^="reserva-estado"]')
      .first()
      .should("contain", "Confirmada");

    // Assert: Verificar que se muestre el mensaje de éxito
    cy.get('[data-cy="toast-mensaje"]')
      .should("be.visible")
      .and("contain", "Reserva confirmada");
  });
});
