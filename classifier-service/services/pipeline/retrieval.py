from abc import ABC, abstractmethod
from services import classifier_chroma_store

class RetrievalStrategy(ABC):
    @abstractmethod
    def retrieve(self, user_email: str, query_embedding: list[float], top_k: int) -> list[dict]:
        """
        Retrieve semantically similar emails for a user.
        Returns a list of dicts with keys: category, subject, sender, similarity, source.
        """
        pass

class ChromaDBRetrievalStrategy(RetrievalStrategy):
    def retrieve(self, user_email: str, query_embedding: list[float], top_k: int) -> list[dict]:
        return classifier_chroma_store.query_similar(user_email, query_embedding, top_k)
