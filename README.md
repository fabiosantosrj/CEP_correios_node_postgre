# CEP_correios_node_postgreSQL
consulta cep diretamente no correio e armazena em db local



Para rodar será necessário:
-Banco de dados Postgres Instalado
-criar dabase "cep"
-criar tabela "ceptable", som a estrutura abaixo:

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
    CONSTRAINT ceptable_pk PRIMARY KEY (cep)
    )
    WITH (
    OIDS=FALSE
    );
    ALTER TABLE ceptable
    OWNER TO postgres;
    COMMENT ON COLUMN ceptable.exist_no_ws IS 'CEP exist no WS do correio?';


    -- Index: ceptable_cep_idx

    -- DROP INDEX ceptable_cep_idx;

    CREATE INDEX ceptable_cep_idx
    ON ceptable
    USING btree
    (cep COLLATE pg_catalog."default");


-para executar, digitar no terminal 
node webCorreio2WorksAsync.js

agauardar... esse processo irá varrer todos so cep possiveis do correio e armazenar na tabela local, isso demorará varios dias...

