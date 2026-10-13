// ==============================================================================
// AGROPULSE - PRUEBAS UNITARIAS: IDEMPOTENCIA Y RF-16 (RNF-08)
// ==============================================================================

import { IrrigationCommand } from '../src/types/database';

describe('Idempotencia de Comandos y Bloqueo de Doble Pending (RF-16, RNF-08)', () => {
  // Simulación de la tabla de comandos y la lógica de validación atómica
  let commandDatabase: IrrigationCommand[] = [];

  beforeEach(() => {
    commandDatabase = [];
  });

  const simulateIssueCommand = (
    valveId: string,
    action: 'open' | 'close' | 'irrigate_duration',
    durationMin: number | undefined,
    clientRequestId: string
  ): { success: boolean; error?: string; command?: IrrigationCommand; idempotent?: boolean } => {
    // 1. Idempotencia: Si ya existe un comando con el mismo client_request_id, retornar el existente
    const existing = commandDatabase.find((c) => c.client_request_id === clientRequestId);
    if (existing) {
      return { success: true, command: existing, idempotent: true };
    }

    // 2. RF-16: Bloqueo de segundo comando pending sobre la misma válvula
    const hasPendingOnValve = commandDatabase.some(
      (c) => c.valve_id === valveId && c.status === 'pending'
    );
    if (hasPendingOnValve) {
      return {
        success: false,
        error: 'Ya existe un comando en espera para esta válvula (RF-16)',
      };
    }

    // 3. Crear nuevo comando
    const newCommand: IrrigationCommand = {
      id: 'cmd_' + (commandDatabase.length + 1),
      valve_id: valveId,
      requested_by: 'user-producer-1',
      action,
      duration_min: durationMin,
      status: 'pending',
      client_request_id: clientRequestId,
      created_at: new Date().toISOString(),
    };

    commandDatabase.push(newCommand);
    return { success: true, command: newCommand, idempotent: false };
  };

  test('Emisión de comando inicial se registra en estado pending', () => {
    const res = simulateIssueCommand('valve-costa2-1', 'irrigate_duration', 30, 'req_uuid_1001');
    expect(res.success).toBe(true);
    expect(res.command?.status).toBe('pending');
    expect(res.command?.client_request_id).toBe('req_uuid_1001');
    expect(res.idempotent).toBe(false);
    expect(commandDatabase.length).toBe(1);
  });

  test('Idempotencia: Reenviar el mismo client_request_id NO crea un duplicado', () => {
    // Primer intento
    const res1 = simulateIssueCommand('valve-costa2-1', 'irrigate_duration', 30, 'req_uuid_1002');
    expect(res1.success).toBe(true);
    expect(commandDatabase.length).toBe(1);

    // Segundo intento idéntico (ej. reintento de red)
    const res2 = simulateIssueCommand('valve-costa2-1', 'irrigate_duration', 30, 'req_uuid_1002');
    expect(res2.success).toBe(true);
    expect(res2.idempotent).toBe(true);
    expect(res2.command?.id).toBe(res1.command?.id);
    // La base de datos no debe duplicar la fila
    expect(commandDatabase.length).toBe(1);
  });

  test('RF-16: Se rechaza un segundo comando con distinto ID si la válvula ya tiene uno pending', () => {
    // Primer comando puesto en pending
    simulateIssueCommand('valve-costa2-1', 'open', undefined, 'req_uuid_1003');

    // Segundo comando sobre la misma válvula con nuevo client_request_id
    const resSecond = simulateIssueCommand('valve-costa2-1', 'close', undefined, 'req_uuid_1004');
    expect(resSecond.success).toBe(false);
    expect(resSecond.error).toContain('RF-16');
    expect(commandDatabase.length).toBe(1);
  });

  test('Permite un nuevo comando una vez que el anterior pasa a applied o cancelled', () => {
    // Primer comando
    const res1 = simulateIssueCommand('valve-costa2-1', 'open', undefined, 'req_uuid_1005');
    expect(res1.success).toBe(true);

    // Simulador aplica el comando
    const appliedCmd = commandDatabase.find((c) => c.client_request_id === 'req_uuid_1005');
    if (appliedCmd) appliedCmd.status = 'applied';

    // Ahora sí debe permitir el nuevo comando
    const res2 = simulateIssueCommand('valve-costa2-1', 'close', undefined, 'req_uuid_1006');
    expect(res2.success).toBe(true);
    expect(res2.command?.status).toBe('pending');
    expect(commandDatabase.length).toBe(2);
  });
});
