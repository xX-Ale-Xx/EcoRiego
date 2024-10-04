from flask import Flask, jsonify
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

# Función para monitorear la humedad en segundo plano
def monitorear_humedad():
    global humedad_estado
    try:
        while True:
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

# Iniciar el hilo para monitorear la humedad
hilo_humedad = threading.Thread(target=monitorear_humedad)
hilo_humedad.daemon = True  # El hilo se cerrará cuando el programa principal termine
hilo_humedad.start()

# Ruta para obtener el estado del sensor de humedad
@app.route('/humedad', methods=['GET'])
def obtener_humedad():
    return jsonify(humedad_estado)

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000)
