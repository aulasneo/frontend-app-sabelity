import React from 'react';
import { Button, Card } from '@openedx/paragon';

import './stylesHome.css';

const Home = () => (
    <>
        <h1 className="mb-4">Elige el mejor plan a tu medida</h1>
        <main>
            <div className="text-center mt-5">
                <div className="contentCards">
                    <Card className="p-3" style={{ width: '18rem', height: "20rem" }}>
                        <Card.Body>
                            <Card.Header
                                title="Basic" />
                            <Card.Section>
                                Crear hasta 3 cursos.
                            </Card.Section>
                            <Button className="buttonSuscribe">Comprar</Button>
                        </Card.Body>
                    </Card>

                    <Card className="p-3" style={{ width: '18rem' }}>
                        <Card.Body>
                            <Card.Header
                                title="Standard" />
                            <Card.Section>
                                Crear hasta 5 cursos.
                            </Card.Section>
                            <Button className="buttonSuscribe">Comprar</Button>
                        </Card.Body>
                    </Card>

                    <Card className="p-3" style={{ width: '18rem' }}>
                        <Card.Body>
                            <Card.Header
                                title="Premium" />
                            <Card.Section>
                                Crear hasta 10 cursos.
                            </Card.Section>
                            <Button className="buttonSuscribe">Comprar</Button>
                        </Card.Body>
                    </Card>

                </div>
                <Button variant="outline-primary" className="mt-4">Volver a Studio</Button>
            </div>
        </main>
    </>
);

export default Home;
