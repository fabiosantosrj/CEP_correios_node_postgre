# CEP_correios_node_postgreSQL
consulta cep diretamente no correio e armazena em db local



Para rodar será necessário:

-Banco de dados Postgres Instalado

CREATE DATABASE cep
  WITH OWNER = postgres
       ENCODING = 'UTF8'
       TABLESPACE = pg_default
       LC_COLLATE = 'Portuguese_Brazil.1252'
       LC_CTYPE = 'Portuguese_Brazil.1252'
       CONNECTION LIMIT = -1;


-- Table: ceptable

-- DROP TABLE ceptable;

CREATE TABLE ceptable
(
  cep character varying NOT NULL,
  logradouro character varying,
  bairro character varying,
  cidade character varying,
  estado character varying,
  complemento character varying,
  exist_no_ws character varying, -- CEP exist no WS do correio?
  data_consulta timestamp(0) without time zone,
  nome_unidade character varying, -- NOme da Unidade/predio
  tipo_cep character varying, -- Tipo de cep, 5=Unidade(predio), 2=Rua, 1=Cidade
  CONSTRAINT ceptable_pk PRIMARY KEY (cep)
)
WITH (
  OIDS=FALSE
);

ALTER TABLE ceptable

  OWNER TO postgres;
  
COMMENT ON COLUMN ceptable.exist_no_ws IS 'CEP exist no WS do correio?';
COMMENT ON COLUMN ceptable.nome_unidade IS 'NOme da Unidade/predio';
COMMENT ON COLUMN ceptable.tipo_cep IS 'Tipo de cep, 5=Unidade(predio), 2=Rua, 1=Cidade';



-para executar, digitar no terminal 
node webCorreio2WorksAsync.js

agauardar... esse processo irá varrer todos os possiveis CEP do correio e armazenar na tabela local, isso demorará varios dias...

