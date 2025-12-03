import os

class Config:
    SECRET_KEY = os.environ.get("SECRET_KEY", "dev-secret-key")

    BASEDIR = os.path.abspath(os.path.dirname(__file__))
    INSTANCE_DIR = os.path.join(BASEDIR, "..", "instance")

    SQLALCHEMY_DATABASE_URI = "sqlite:///" + os.path.join(INSTANCE_DIR, "bp_guardian.db")
    SQLALCHEMY_TRACK_MODIFICATIONS = False
