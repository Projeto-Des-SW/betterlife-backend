const mongoose = require('mongoose');

const animalSchema = new mongoose.Schema({
    nome: {
        type: String,
        required: true,
        trim: true
    },
    nomecientifico: {
        type: String,
        required: true,
        trim: true
    },
    sexo: {
        type: String,
        required: true,
        trim: true,
        maxlength: 10
    },
    peso: {
        type: Number,
        required: true,
    },
    idade: {
        type: Number,
        required: true,
    },
    descricao: {
        type: String,
        required: true,
        trim: true
    },
    observacaodaespecie: {
        type: String,
        required: true,
        trim: true
    },
    usuarioid: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: 'User'
    },
    imagensid: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Imagem'
    },
    somid: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Som'
    },
    taxonomiaid: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: 'Taxonomia'
    },
    deletado: {
        type: Boolean,
        default: false
    }
});

const Animal = mongoose.model('Animal', animalSchema);

module.exports = Animal;
