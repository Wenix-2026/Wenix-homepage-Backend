<?php
// src/DataFixtures/AppFixtures.php

namespace App\DataFixtures;

use App\Entity\User;
use Doctrine\Bundle\FixturesBundle\Fixture;
use Doctrine\Persistence\ObjectManager;
use Symfony\Component\PasswordHasher\Hasher\UserPasswordHasherInterface;

class AppFixtures extends Fixture
{
    public function __construct(
        private UserPasswordHasherInterface $passwordHasher
    ) {}

    public function load(ObjectManager $manager): void
    {
        $admin = new User();
        $admin->setEmail('admin@example.com');
        $admin->setRoles(['ROLE_ADMIN']);

        // Heslo se hashuje přes interface — nikdy neukládej plaintext!
        $hashedPassword = $this->passwordHasher->hashPassword($admin, 'Admin1234!');
        $admin->setPassword($hashedPassword);

        $manager->persist($admin);
        $manager->flush();

        echo "✅ Admin vytvořen: admin@example.com / Admin1234!\n";
    }
}
