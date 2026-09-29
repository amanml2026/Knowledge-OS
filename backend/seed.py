from sqlalchemy.orm import Session
import database, models, schemas

def seed_db():
    database.Base.metadata.create_all(bind=database.engine)
    db = database.SessionLocal()
    
    if db.query(models.Concept).count() > 0:
        print("Database already seeded")
        db.close()
        return

    # Create concepts
    calculus = models.Concept(title="Calculus", explanation="The mathematical study of continuous change.", difficulty=0.8, mastery_level=0.9, confidence=0.85)
    derivatives = models.Concept(title="Derivatives", explanation="Measures the sensitivity to change of the function value with respect to a change in its argument.", difficulty=0.6, mastery_level=0.8)
    partial = models.Concept(title="Partial Derivatives", explanation="A derivative of a function of two or more variables with respect to one variable, with the others held constant.", difficulty=0.7, mastery_level=0.4)
    chain = models.Concept(title="Chain Rule", explanation="A formula to compute the derivative of a composite function.", difficulty=0.6, mastery_level=0.7)
    gradients = models.Concept(title="Gradients", explanation="A multi-variable generalization of the derivative.", difficulty=0.8, mastery_level=0.5)
    backprop = models.Concept(title="Backpropagation", explanation="An algorithm used to calculate derivatives quickly in neural networks.", difficulty=0.9, mastery_level=0.3)

    db.add_all([calculus, derivatives, partial, chain, gradients, backprop])
    db.commit()

    # Create relationships
    rels = [
        models.ConceptRelationship(prerequisite_id=calculus.id, dependent_id=derivatives.id),
        models.ConceptRelationship(prerequisite_id=derivatives.id, dependent_id=partial.id),
        models.ConceptRelationship(prerequisite_id=derivatives.id, dependent_id=chain.id),
        models.ConceptRelationship(prerequisite_id=partial.id, dependent_id=gradients.id),
        models.ConceptRelationship(prerequisite_id=chain.id, dependent_id=backprop.id),
        models.ConceptRelationship(prerequisite_id=gradients.id, dependent_id=backprop.id),
    ]
    
    db.add_all(rels)
    db.commit()
    print("Database seeded successfully.")
    db.close()

if __name__ == "__main__":
    seed_db()
