import { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import styles from './Pagos.module.css';
import { default as transbankService } from '../../../services/transbank';

export const PagoRetorno = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [procesando, setProcesando] = useState(true);
  const [exito, setExito] = useState(false);
  const [mensaje, setMensaje] = useState('Procesando tu pago...');
  const [detalles, setDetalles] = useState<{ [key: string]: any } | null>(null);

  useEffect(() => {
    const procesarRetorno = async () => {
      try {
        // Extraer el token del query string
        const searchParams = new URLSearchParams(location.search);
        const token = searchParams.get('token_ws');

        if (!token) {
          setExito(false);
          setMensaje('Token no encontrado. No se puede procesar el pago.');
          setProcesando(false);
          return;
        }

        // En un ambiente real, esto enviaría el token a Transbank
        // En nuestro caso de prueba, simulamos una respuesta exitosa
        const resultado = await transbankService.commitTransaction(token);

        if (resultado.status === 'AUTHORIZED' && resultado.response_code === 0) {
          setExito(true);
          setMensaje('¡Pago procesado exitosamente!');
          setDetalles({
            monto: resultado.amount,
            tarjeta: resultado.card_detail.card_number,
            ordenCompra: resultado.buy_order,
            autorizacion: resultado.authorization_code,
            fecha: new Date(resultado.transaction_date).toLocaleString('es-CL')
          });
        } else {
          setExito(false);
          setMensaje('Error al procesar el pago. Por favor intenta nuevamente.');
        }
      } catch (error) {
        console.error('Error al procesar retorno de Transbank:', error);
        setExito(false);
        setMensaje('Ocurrió un error inesperado. Por favor intenta nuevamente.');
      } finally {
        setProcesando(false);
      }
    };

    procesarRetorno();
  }, [location]);

  const volverAPagos = () => {
    navigate('/dashboard/pagos');
  };

  return (
    <div className={styles.pagoRetornoContainer}>
      <div className={styles.pagoRetornoCard}>
        <div className={styles.pagoRetornoHeader}>
          <img src="/favicon.svg" alt="SIGEPA Logo" className={styles.favicon} />
          <h2>Resultado del Pago</h2>
        </div>

        <div className={styles.pagoRetornoBody}>
          {procesando ? (
            <div className={styles.procesandoContainer}>
              <div className={styles.spinner}></div>
              <p>Procesando transacción...</p>
              <p className={styles.procesandoDesc}>
                Por favor espera mientras confirmamos tu pago con Transbank
              </p>
            </div>
          ) : exito ? (
            <div className={styles.exitoContainer}>
              <div className={styles.iconoExito}>✓</div>
              <h3>¡Pago Exitoso!</h3>
              <p>Tu pago ha sido procesado correctamente</p>
              
              {detalles && (
                <div className={styles.detallesPago}>
                  <div className={styles.detalleItem}>
                    <span className={styles.detalleLabel}>Monto:</span>
                    <span className={styles.detalleValor}>
                      {new Intl.NumberFormat('es-CL', {
                        style: 'currency',
                        currency: 'CLP'
                      }).format(detalles.monto)}
                    </span>
                  </div>
                  <div className={styles.detalleItem}>
                    <span className={styles.detalleLabel}>Tarjeta:</span>
                    <span className={styles.detalleValor}>{detalles.tarjeta}</span>
                  </div>
                  <div className={styles.detalleItem}>
                    <span className={styles.detalleLabel}>Orden:</span>
                    <span className={styles.detalleValor}>{detalles.ordenCompra}</span>
                  </div>
                  <div className={styles.detalleItem}>
                    <span className={styles.detalleLabel}>Autorización:</span>
                    <span className={styles.detalleValor}>{detalles.autorizacion}</span>
                  </div>
                  <div className={styles.detalleItem}>
                    <span className={styles.detalleLabel}>Fecha:</span>
                    <span className={styles.detalleValor}>{detalles.fecha}</span>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className={styles.errorContainer}>
              <div className={styles.iconoError}>✕</div>
              <h3>Error en el Pago</h3>
              <p>{mensaje}</p>
            </div>
          )}
        </div>

        <div className={styles.pagoRetornoFooter}>
          <button
            className={`${styles.botonVolver} ${procesando ? styles.botonDeshabilitado : ''}`}
            onClick={volverAPagos}
            disabled={procesando}
          >
            {exito ? 'Volver a Pagos' : 'Intentar Nuevamente'}
          </button>
        </div>
      </div>
    </div>
  );
}; 