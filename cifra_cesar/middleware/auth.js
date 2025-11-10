import jwt from 'jsonwebtoken';
import User from '../models/User.js';

/**
 * middleware de autenticação JWT
 * verifica e valida o token JWT enviado no header Authorization
 */
const auth = async (req, res, next) => {
  try {
    // token do header auth
    const authHeader = req.header('Authorization');
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: 'Acesso negado. Token não fornecido.'
      });
    }

    // extrair o token
    const token = authHeader.substring(7);

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Acesso negado. Token inválido.'
      });
    }

    try {
      // verificar e decodificar o token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // buscar usuário no banco
      const user = await User.findById(decoded.id).select('-senha');
      
      if (!user) {
        return res.status(401).json({
          success: false,
          message: 'Usuário não encontrado. Token inválido.'
        });
      }

      // adicionar usuário ao request para uso nas rotas
      req.user = user;
      req.userId = decoded.id;
      
      next();
    } catch (jwtError) {
      if (jwtError.name === 'TokenExpiredError') {
        return res.status(401).json({
          success: false,
          message: 'Token expirado. Faça login novamente.'
        });
      }
      
      if (jwtError.name === 'JsonWebTokenError') {
        return res.status(401).json({
          success: false,
          message: 'Token inválido.'
        });
      }

      throw jwtError;
    }
  } catch (error) {
    console.error('Erro no middleware de autenticação:', error);
    return res.status(500).json({
      success: false,
      message: 'Erro no servidor durante autenticação.'
    });
  }
};

export default auth;
