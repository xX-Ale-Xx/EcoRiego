from flask import Flask, jsonify, request
from flask_cors import CORS
import RPi.GPIO as GPIO
import threading
import time

app = Flask(__name__)
CORS(app)

# Configuración de pines
PIN_SENSOR_DIGITAL = 17  # Pin GPIO del sensor de humedad (salida digital)
PIN_RELE = 27  # Pin GPIO del relé

# Configuración de la Raspberry Pi
GPIO.setmode(GPIO.BCM)
GPIO.setup(PIN_SENSOR_DIGITAL, GPIO.IN)
GPIO.setup(PIN_RELE, GPIO.OUT)

# Asegurarse de que el relé esté apagado al iniciar
GPIO.output(PIN_RELE, GPIO.LOW)

# Variable para almacenar el estado del sensor de humedad
humedad_estado = {'humedad': 0}

# Variables para controlar el hilo
monitoreo_activo = threading.Event()
hilo_humedad = None

# Función para monitorear la humedad en segundo plano
def monitorear_humedad():
    global humedad_estado
    try:
        while monitoreo_activo.is_set():
            # Leer el valor del sensor de humedad
            humedad = GPIO.input(PIN_SENSOR_DIGITAL)

            if humedad == 0:  # Si está húmeda
                print("La tierra está húmeda. Bomba apagada.")
                GPIO.output(PIN_RELE, GPIO.HIGH)  # Apagar la bomba
            else:  # Si está seca
                print("La tierra está seca. Bomba encendida.")
                GPIO.output(PIN_RELE, GPIO.LOW)  # Encender la bomba
                time.sleep(2)

            # Actualizar el estado del sensor
            humedad_estado['humedad'] = humedad
            time.sleep(1)

    except KeyboardInterrupt:
        print("Deteniendo...")
    finally:
        GPIO.cleanup()

# Ruta para obtener el estado del sensor de humedad
@app.route('/humedad', methods=['GET'])
def obtener_humedad():
    return jsonify(humedad_estado)

# Ruta para activar el modo manual y detener el monitoreo automático
@app.route('/manual', methods=['POST'])
def modo_manual():
    global hilo_humedad
    monitoreo_activo.clear()  # Detiene el hilo de monitoreo
    if hilo_humedad:
        hilo_humedad.join()  # Espera a que el hilo termine
        GPIO.setmode(GPIO.BCM)  # Configura el modo GPIO si es necesario
        GPIO.setup(PIN_RELE, GPIO.OUT)  # Asegurarse de que el pin está configurado como salida
        GPIO.output(PIN_RELE, GPIO.HIGH)  # Apagar la bomba en modo manual
    return jsonify({"status": "Modo manual activado"})

# Ruta para activar el modo automático
@app.route('/automatico', methods=['POST'])
def modo_automatico():
    global hilo_humedad
    if not monitoreo_activo.is_set():
        monitoreo_activo.set()  # Activa el monitoreo
        hilo_humedad = threading.Thread(target=monitorear_humedad)
        hilo_humedad.start()
    return jsonify({"status": "Modo automático activado"})

# Ruta para pausar la bomba manualmente
@app.route('/pause', methods=['POST'])
def pausar_bomba():
    try:
        GPIO.setmode(GPIO.BCM)
        GPIO.setup(PIN_RELE, GPIO.OUT)  # Asegúrate de que el pin esté configurado
        GPIO.output(PIN_RELE, GPIO.HIGH)  # Apagar la bomba
        return jsonify({"status": "Bomba pausada"}), 200
    except RuntimeError as e:
        return jsonify({"error": str(e)}), 500

# Ruta para reanudar la bomba manualmente
@app.route('/resume', methods=['POST'])
def reanudar_bomba():
    try:
        # Asegúrate de configurar el pin como salida
        GPIO.setmode(GPIO.BCM)  # Establecer el modo GPIO nuevamente
        GPIO.setup(PIN_RELE, GPIO.OUT)  # Asegurarse de que el pin se configure como salida
        GPIO.output(PIN_RELE, GPIO.LOW)  # Encender la bomba
        return jsonify({"status": "Bomba reanudada"}), 200
        
    except RuntimeError:
        return jsonify({"error": "Ocurrio un error"}), 500

if __name__ == '__main__':
    try:
        app.run(host='0.0.0.0', port=5000)
    finally:
        GPIO.cleanup()
