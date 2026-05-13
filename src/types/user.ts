export type TipoAcesso =
    | 'professor'
    | 'aplicador';

export type User = {

    id_aplicador: number;

    cpf_aplicador: string;

    token: string;

    tipo_acesso: TipoAcesso;

};